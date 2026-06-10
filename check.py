import yaml
import requests
import concurrent.futures
import os
import json
import threading

YAML_FILE = os.getenv('YAML_FILE', 'link.yml')
OUTPUT_PATH = os.getenv('OUTPUT_PATH', os.path.join('public', 'check_links.json'))
MANUAL_CHECK_FILE = os.getenv('MANUAL_CHECK_FILE', 'manual_check.json')
CF_WORKER_URL = os.getenv('CF_WORKER_URL', '')
MAX_WORKERS = int(os.getenv('CHECK_WORKERS', '10'))

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/120.0.0.0 Safari/537.36"
)

inaccessible_lock = threading.Lock()
inaccessible_links = set()


def check_link_accessibility(link):
    headers = {"User-Agent": USER_AGENT}
    try:
        response = requests.head(link, headers=headers, timeout=10)
        if response.status_code != 200:
            response = requests.get(link, headers=headers, timeout=10)
            if response.status_code != 200:
                print(f"[直接检测] 不可访问: {link} (状态码: {response.status_code})")
                with inaccessible_lock:
                    inaccessible_links.add(link)
                return
        print(f"[直接检测] 可访问: {link}")
    except requests.RequestException as e:
        print(f"[直接检测] 不可访问: {link} ({e})")
        with inaccessible_lock:
            inaccessible_links.add(link)


def api_check_link(link):
    api_url = f"https://v2.xxapi.cn/api/status?url={link}"
    headers = {"User-Agent": USER_AGENT}
    try:
        print(f"[第三方API] 检测: {link}")
        response = requests.get(api_url, headers=headers, timeout=30)
        result = response.json()
        code = int(result.get("code", 0))
        data = int(result.get("data", 0))
        if code == 200 and data == 200:
            print(f"[第三方API] 可访问: {link}")
            with inaccessible_lock:
                inaccessible_links.discard(link)
        else:
            print(f"[第三方API] 不可访问: {link} (code={code}, data={data})")
            with inaccessible_lock:
                inaccessible_links.add(link)
    except Exception as e:
        print(f"[第三方API] 异常: {link} ({e})")
        with inaccessible_lock:
            inaccessible_links.add(link)


def cf_worker_check_link(link):
    try:
        print(f"[Cloudflare Worker] 检测: {link}")
        response = requests.get(CF_WORKER_URL, params={'url': link}, timeout=10)
        if response.status_code == 200:
            result = response.json()
            if result.get('status') == 'down':
                print(f"[Cloudflare Worker] 不可访问: {link}")
                with inaccessible_lock:
                    inaccessible_links.add(link)
            else:
                print(f"[Cloudflare Worker] 可访问: {link}")
                with inaccessible_lock:
                    inaccessible_links.discard(link)
        else:
            print(f"[Cloudflare Worker] 检测失败: {link} (状态码: {response.status_code})")
            with inaccessible_lock:
                inaccessible_links.add(link)
    except Exception as e:
        print(f"[Cloudflare Worker] 异常: {link} ({e})")
        with inaccessible_lock:
            inaccessible_links.add(link)


def run_checks(links, check_fn, stage_name):
    if not links:
        return
    print(f"\n===== {stage_name} ({len(links)} 个链接) =====")
    with concurrent.futures.ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = [executor.submit(check_fn, link) for link in links]
        concurrent.futures.wait(futures)


def main():
    print(f"读取配置文件: {YAML_FILE}")
    with open(YAML_FILE, 'r', encoding='utf-8') as f:
        data = yaml.safe_load(f)

    manual_checks = {}
    if os.path.exists(MANUAL_CHECK_FILE):
        with open(MANUAL_CHECK_FILE, 'r', encoding='utf-8') as f:
            manual_checks = json.load(f)
        print(f"已加载手动标记: {len(manual_checks)} 条")

    links_to_check = []
    for section in data or []:
        for item in section.get('link_list', []):
            links_to_check.append(item['link'])

    print(f"共发现 {len(links_to_check)} 个链接")

    run_checks(links_to_check, check_link_accessibility, '阶段一: 直接检测')

    with inaccessible_lock:
        remaining = list(inaccessible_links)
    run_checks(remaining, api_check_link, '阶段二: 第三方 API 检测')

    with inaccessible_lock:
        remaining = list(inaccessible_links)
    if CF_WORKER_URL and remaining:
        run_checks(remaining, cf_worker_check_link, '阶段三: Cloudflare Worker 检测')
    elif remaining:
        print(f"\n未配置 CF_WORKER_URL，跳过 Cloudflare Worker 检测，剩余 {len(remaining)} 个链接标记为异常")

    print("\n===== 生成检测结果 =====")
    output_data = []
    error_section = {
        'class_name': '友链异常区',
        'class_desc': '会手动检测',
        'link_list': []
    }
    accessible_count = 0
    inaccessible_count = 0

    for section in data or []:
        if 'link_list' not in section:
            continue
        section_data = {
            'class_name': section.get('class_name', '未知类别'),
            'class_desc': section.get('class_desc', '无描述'),
            'link_list': []
        }
        for item in section['link_list']:
            link = item['link']
            manual_status = manual_checks.get(link)
            if manual_status:
                link_status = manual_status
                print(f"[手动] {link} -> {link_status}")
            else:
                with inaccessible_lock:
                    is_inaccessible = link in inaccessible_links
                if is_inaccessible:
                    link_status = "不可访问"
                    inaccessible_count += 1
                else:
                    link_status = "正常"
                    accessible_count += 1
                print(f"[最终] {link} -> {link_status}")

            entry = {
                'name': item['name'],
                'link': link,
                'avatar': item['avatar'],
                'descr': item['descr'],
                'status': link_status,
            }

            if link_status == "正常":
                section_data['link_list'].append(entry)
            else:
                error_section['link_list'].append(entry)

        if section_data['link_list']:
            output_data.append(section_data)

    if error_section['link_list']:
        output_data.append(error_section)

    os.makedirs(os.path.dirname(OUTPUT_PATH) or '.', exist_ok=True)
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, ensure_ascii=False, indent=4)

    print(f"\n结果已写入: {OUTPUT_PATH}")
    print(f"总计: {accessible_count + inaccessible_count}")
    print(f"正常: {accessible_count}")
    print(f"异常: {inaccessible_count}")


if __name__ == '__main__':
    main()
