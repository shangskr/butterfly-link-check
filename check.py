import yaml
import requests
import concurrent.futures
import os
import json
from time import sleep

yaml_file_path = 'link.yml'
output_json_path = os.path.join('public', 'check_links.json')
manual_check_file = 'manual_check.json'

user_agent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36"
cf_worker_url = "https://butterfly-link-check.distanceskr.workers.dev"

with open(yaml_file_path, 'r', encoding='utf-8') as file:
    data = yaml.safe_load(file)

manual_checks = {}
if os.path.exists(manual_check_file):
    with open(manual_check_file, 'r', encoding='utf-8') as manual_file:
        manual_checks = json.load(manual_file)

inaccessible_links = set()

def check_link_accessibility(link):
    headers = {"User-Agent": user_agent}
    try:
        response = requests.head(link, headers=headers, timeout=10)
        if response.status_code != 200:
            response = requests.get(link, headers=headers, timeout=10)
            if response.status_code != 200:
                print(f"[直接检测] 链接不可访问: {link} (状态码: {response.status_code})")
                inaccessible_links.add(link)
                return
        print(f"[直接检测] 链接可访问: {link} (状态码: {response.status_code})")
    except requests.RequestException as e:
        print(f"[直接检测] 链接不可访问: {link} (错误: {e})")
        inaccessible_links.add(link)

def api_check_link(link):
    api_url = f"https://v2.xxapi.cn/api/status?url={link}"
    headers = {"User-Agent": user_agent}
    try:
        print(f"[小小API] 开始检测: {link}")
        response = requests.get(api_url, headers=headers, timeout=30)
        result = response.json()
        if int(result.get("code")) == 200 and int(result.get("data")) == 200:
            print(f"[小小API] 链接可访问: {link}")
            if link in inaccessible_links:
                inaccessible_links.remove(link)
        else:
            print(f"[小小API] 链接不可访问: {link} (代码: {result.get('code')}, 数据: {result.get('data')})")
            inaccessible_links.add(link)
    except Exception as e:
        print(f"[小小API] 检测异常: {link} (错误: {e})")
        inaccessible_links.add(link)

def cf_worker_check_link(link):
    try:
        print(f"[Cloudflare] 开始检测: {link}")
        response = requests.get(cf_worker_url, params={'url': link}, timeout=10)
        if response.status_code == 200:
            result = response.json()
            if result.get('status') == 'down':
                print(f"[Cloudflare] 链接不可访问: {link}")
                inaccessible_links.add(link)
            else:
                print(f"[Cloudflare] 链接可访问: {link}")
                if link in inaccessible_links:
                    inaccessible_links.remove(link)
        else:
            print(f"[Cloudflare] 检测失败: {link} (状态码: {response.status_code})")
            inaccessible_links.add(link)
    except Exception as e:
        print(f"[Cloudflare] 检测异常: {link} (错误: {e})")
        inaccessible_links.add(link)

links_to_check = []
for section in data:
    if 'link_list' in section:
        for item in section['link_list']:
            links_to_check.append(item['link'])

print("开始直接检测链接...")
with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
    futures = [executor.submit(check_link_accessibility, link) for link in links_to_check]
    concurrent.futures.wait(futures)

if inaccessible_links:
    print(f"\n开始使用小小API检测 {len(inaccessible_links)} 个不可访问链接...")
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        futures = [executor.submit(api_check_link, link) for link in inaccessible_links.copy()]
        concurrent.futures.wait(futures)

if inaccessible_links:
    print(f"\n开始使用Cloudflare Worker检测 {len(inaccessible_links)} 个不可访问链接...")
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        futures = [executor.submit(cf_worker_check_link, link) for link in inaccessible_links.copy()]
        concurrent.futures.wait(futures)

output_data = []
accessible_count = 0
inaccessible_count = 0

# 创建异常区
error_section = {
    'class_name': '友链异常区',
    'class_desc': '会手动检测',
    'link_list': []
}

print("\n生成检测结果...")
for section in data:
    if 'link_list' in section:
        section_data = {
            'class_name': section.get('class_name', '未知类别'),
            'class_desc': section.get('class_desc', '无描述'),
            'link_list': []
        }
        for item in section['link_list']:
            manual_status = manual_checks.get(item['link'], None)
            if manual_status:
                link_status = manual_status
                print(f"[手动标记] 链接: {item['link']} 状态: {link_status}")
            else:
                if item['link'] not in inaccessible_links:
                    link_status = "正常"
                    accessible_count += 1
                else:
                    link_status = "不可访问"
                    inaccessible_count += 1
                    # 将不可访问的链接添加到异常区
                    error_section['link_list'].append({
                        'name': item['name'],
                        'link': item['link'],
                        'avatar': item['avatar'],
                        'descr': item['descr'],
                        'status': link_status
                    })
                print(f"[最终状态] 链接: {item['link']} 状态: {link_status}")
            
            # 只将正常链接添加到原分类
            if link_status == "正常":
                section_data['link_list'].append({
                    'name': item['name'],
                    'link': item['link'],
                    'avatar': item['avatar'],
                    'descr': item['descr'],
                    'status': link_status
                })
        
        # 只有当分类中还有正常链接时才保留该分类
        if section_data['link_list']:
            output_data.append(section_data)

# 如果有不可访问的链接，添加异常区
if error_section['link_list']:
    output_data.append(error_section)

with open(output_json_path, 'w', encoding='utf-8') as file:
    json.dump(output_data, file, ensure_ascii=False, indent=4)

total_links = accessible_count + inaccessible_count
print(f"\n检测完成!")
print(f"JSON文件已生成: {output_json_path}")
print(f"总共检测链接: {total_links} 个")
print(f"正常链接: {accessible_count} 个")
print(f"异常链接: {inaccessible_count} 个")
