import yaml
import requests
import concurrent.futures
import os
import json
from time import sleep

# 文件路径
yaml_file_path = 'link.yml'
output_json_path = os.path.join('public', 'check_links.json')  # 修改为 public 目录
manual_check_file = 'manual_check.json'  # 额外的手动检查文件

# 获取API的key（假设你已经设置了环境变量 API_KEY）
api_key = os.getenv('API_KEY')

# Cloudflare Worker API的URL（假设你已经设置了 Worker API）
cf_worker_url = "https://butterfly-link-check.distanceskr.workers.dev"  # 修改为你的Worker API URL

# 加载YAML数据
with open(yaml_file_path, 'r', encoding='utf-8') as file:
    data = yaml.safe_load(file)

# 加载手动检查的数据
manual_checks = {}
if os.path.exists(manual_check_file):
    with open(manual_check_file, 'r', encoding='utf-8') as manual_file:
        manual_checks = json.load(manual_file)

# 模拟浏览器的User-Agent字符串
user_agent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36"

# 存储无法访问的链接
inaccessible_links = set()  # 使用 set 避免重复链接

# 检查链接是否可访问的函数
def check_link_accessibility(link):
    headers = {"User-Agent": user_agent}
    for _ in range(3):  # 尝试3次
        try:
            # 优先使用 HEAD 请求
            response = requests.head(link, headers=headers, timeout=10)
            # 如果HEAD请求失败，再尝试使用GET请求
            if response.status_code != 200:
                response = requests.get(link, headers=headers, timeout=10)
                if response.status_code != 200:
                    continue  # 仍然无法访问，重试
            print(f"Link {link} is accessible (status code {response.status_code})")  # 输出访问成功的链接
            return  # 如果访问成功，直接返回
        except requests.RequestException:
            sleep(2)  # 暂停2秒后重试
            print(f"Link {link} is not accessible, retrying...")  # 输出重试信息
    print(f"Link {link} is inaccessible after retries")  # 输出最终无法访问的链接
    inaccessible_links.add(link)

# 使用API再次检测链接
def api_check_link(link):
    url = f'https://api.nsmao.net/api/web/query?key={api_key}'
    headers = {"User-Agent": user_agent}
    try:
        response = requests.get(url, headers=headers, params={'link': link}, timeout=10)
        result = response.json()
        # 根据返回结果决定是否仍然认为该链接不可访问
        if result.get('status') != 'ok':
            print(f"API check: {link} is inaccessible.")
            inaccessible_links.add(link)
        else:
            print(f"API check: {link} is accessible.")
    except requests.RequestException:
        print(f"API check error for {link}")
        inaccessible_links.add(link)
    except ValueError:
        # 处理返回的 JSON 格式错误
        print(f"Invalid JSON returned from API for {link}")
        inaccessible_links.add(link)

# 使用Cloudflare Worker API检查链接的可访问性
def cf_worker_check_link(link):
    print(f"Checking link via Cloudflare Worker: {link}")  # 打印正在通过Cloudflare Worker检测的链接
    try:
        response = requests.get(cf_worker_url, params={'url': link}, timeout=10)
        print(f"Cloudflare Worker response for {link}: {response.status_code}, {response.text}")  # 打印响应内容
        if response.status_code == 200:
            result = response.json()
            print(f"Cloudflare Worker result for {link}: {result}")  # 打印Worker返回的完整JSON结果
            if result.get('status') == 'down':  # 如果返回的是 'down'，认为该链接不可访问
                inaccessible_links.add(link)
            else:  # 如果返回 'up'，认为该链接可访问，移除不可访问集合中的该链接
                if link in inaccessible_links:
                    inaccessible_links.remove(link)
        else:
            print(f"Cloudflare Worker responded with error status for {link}: {response.status_code}")
            inaccessible_links.add(link)
    except requests.RequestException as e:
        print(f"Cloudflare Worker error for {link}: {e}")
        inaccessible_links.add(link)
    except ValueError:
        print(f"Cloudflare Worker returned invalid JSON for {link}")
        inaccessible_links.add(link)

# 使用ThreadPoolExecutor并发检查链接
with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
    links_to_check = []
    for section in data:
        if 'link_list' in section:
            for item in section['link_list']:
                links_to_check.append(item['link'])

    # 提交任务到执行器
    futures = [executor.submit(check_link_accessibility, link) for link in links_to_check]

    # 等待任务完成
    concurrent.futures.wait(futures)

    # 对于无法访问的链接，再次调用API进行检查
    futures = [executor.submit(api_check_link, link) for link in inaccessible_links]
    concurrent.futures.wait(futures)

    # 调用Cloudflare Worker API进行检测
    futures = [executor.submit(cf_worker_check_link, link) for link in inaccessible_links]
    concurrent.futures.wait(futures)

# 生成JSON内容
output_data = []
accessible_links = []  # 存储可访问的链接
inaccessible_section = {  # 存储不可访问的链接
    'class_name': '友链异常区域',
    'class_desc': '会手动检查',
    'link_list': []
}

# 输出每个链接的检测结果
print("Generating output data...")  # 输出生成过程
for section in data:
    if 'link_list' in section:
        section_data = {
            'class_name': section.get('class_name', '未知类别'),
            'class_desc': section.get('class_desc', '无描述'),
            'link_list': []
        }
        for item in section['link_list']:
            # 检查是否有手动标记
            manual_status = manual_checks.get(item['link'], None)
            if manual_status:
                link_status = manual_status  # 如果手动标记存在，使用手动标记
            else:
                # 如果链接不在不可访问集合中，说明它是可访问的
                if item['link'] not in inaccessible_links:
                    link_status = "正常"
                else:
                    link_status = "不可访问"
            
            print(f"Link {item['link']} status: {link_status}")  # 打印每个链接的状态
            
            section_data['link_list'].append({
                'name': item['name'],
                'link': item['link'],
                'avatar': item['avatar'],
                'descr': item['descr'],
                'status': link_status
            })
            
            # 将不可访问的链接放入新的 section
            if link_status == "不可访问":
                inaccessible_section['link_list'].append({
                    'name': item['name'],
                    'link': item['link'],
                    'avatar': item['avatar'],
                    'descr': item['descr'],
                    'status': "不可访问"
                })
            else:
                accessible_links.append(item)

        output_data.append(section_data)

# 把不可访问的链接单独放到 output_data 中
if inaccessible_section['link_list']:
    output_data.append(inaccessible_section)

# 将JSON内容写入文件
with open(output_json_path, 'w', encoding='utf-8') as file:
    json.dump(output_data, file, ensure_ascii=False, indent=4)

# 打印结果
print(f"JSON文件生成完毕: {output_json_path}")
