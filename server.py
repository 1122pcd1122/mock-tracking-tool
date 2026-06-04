#!/usr/bin/env python3
# AI-Generated Begin 1780595347
"""
Mock管理本地服务器 - 读写mock文件 + 自动映射到Fiddler + 埋点历史存储
启动: python server.py
访问: http://localhost:8765
"""
import hashlib
import json
import os
import shutil
import sys
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

PORT = 8765
ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR_REAL = os.path.realpath(ROOT_DIR)
MOCKS_DIR = os.path.realpath(os.path.join(ROOT_DIR, 'mocks'))
TRACKING_HISTORY_DIR = os.path.realpath(os.path.join(ROOT_DIR, 'tracking_history'))
FIDDLER_SCRIPTS_DIR = os.path.join(os.path.expanduser('~'), 'Documents', 'Fiddler2', 'Scripts')
MAX_BODY_SIZE = 50 * 1024 * 1024  # 50MB

MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.ico': 'image/x-icon',
}

ALLOWED_ORIGIN = 'http://localhost:8765'


def _is_safe_path(requested_path, base_dir):
    """校验路径在 base_dir 内，防止路径穿越"""
    try:
        real = os.path.realpath(requested_path)
        base = os.path.realpath(base_dir)
        return real == base or (real.startswith(base + os.sep) and os.path.commonpath([real, base]) == base)
    except Exception:
        return False


def _safe_save_file(file_path, content):
    """安全写入文件，确保路径在合法范围内"""
    if not _is_safe_path(file_path, MOCKS_DIR) and not _is_safe_path(file_path, FIDDLER_SCRIPTS_DIR):
        raise PermissionError(f'路径越权: {file_path}')
    dir_path = os.path.dirname(file_path)
    if dir_path:
        os.makedirs(dir_path, exist_ok=True)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)


def _safe_delete_file(file_path):
    """安全删除文件"""
    if not _is_safe_path(file_path, MOCKS_DIR):
        raise PermissionError(f'路径越权: {file_path}')
    if os.path.exists(file_path):
        os.remove(file_path)


# ===== 埋点历史记录管理 =====
def _ensure_tracking_history_dir():
    """确保 tracking_history 目录存在"""
    os.makedirs(TRACKING_HISTORY_DIR, exist_ok=True)


def _load_tracking_index():
    """加载埋点历史索引文件"""
    _ensure_tracking_history_dir()
    index_path = os.path.join(TRACKING_HISTORY_DIR, 'index.json')
    if os.path.exists(index_path):
        try:
            with open(index_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception:
            return []
    return []


def _save_tracking_index(index_data):
    """保存埋点历史索引文件"""
    _ensure_tracking_history_dir()
    index_path = os.path.join(TRACKING_HISTORY_DIR, 'index.json')
    with open(index_path, 'w', encoding='utf-8') as f:
        json.dump(index_data, f, ensure_ascii=False, indent=2)


def _save_tracking_history_entry(entry_id, entry_data):
    """保存一条埋点历史到独立 JSON 文件"""
    _ensure_tracking_history_dir()
    file_path = os.path.join(TRACKING_HISTORY_DIR, f'{entry_id}.json')
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(entry_data, f, ensure_ascii=False, indent=2)


def _delete_tracking_history_file(entry_id):
    """删除埋点历史文件"""
    file_path = os.path.join(TRACKING_HISTORY_DIR, f'{entry_id}.json')
    if os.path.exists(file_path):
        os.remove(file_path)


def scan_mocks(include_content=False):
    """一次扫描返回文件列表 + 分类列表（合并 find_mock_files + find_all_categories）"""
    files = []
    cat_count = {}  # {分类名: 文件数}
    
    if os.path.exists(MOCKS_DIR):
        for entry in os.listdir(MOCKS_DIR):
            full = os.path.join(MOCKS_DIR, entry)
            if os.path.isdir(full):
                count = 0
                for fname in os.listdir(full):
                    if fname.endswith(('.txt', '.js')):
                        fpath = os.path.join(full, fname)
                        f_info = {
                            'name': fname,
                            'path': fpath,
                            'category': entry,
                            'subcategory': '',
                            'requirement': ''
                        }
                        if include_content:
                            try:
                                with open(fpath, 'r', encoding='utf-8') as f:
                                    f_info['content'] = f.read()
                            except Exception:
                                f_info['content'] = ''
                        else:
                            f_info['content'] = ''
                        files.append(f_info)
                        count += 1
                cat_count[entry] = count
            elif os.path.isfile(full) and entry.endswith(('.txt', '.js')):
                f_info = {
                    'name': entry,
                    'path': full,
                    'category': '未分类',
                    'subcategory': '',
                    'requirement': ''
                }
                if include_content:
                    try:
                        with open(full, 'r', encoding='utf-8') as f:
                            f_info['content'] = f.read()
                    except Exception:
                        f_info['content'] = ''
                else:
                    f_info['content'] = ''
                files.append(f_info)
                cat_count['未分类'] = cat_count.get('未分类', 0) + 1

    # 构建分类列表（含空目录）
    categories = []
    if os.path.exists(MOCKS_DIR):
        for entry in os.listdir(MOCKS_DIR):
            full = os.path.join(MOCKS_DIR, entry)
            if os.path.isdir(full):
                categories.append({'name': entry, 'count': cat_count.get(entry, 0)})
    categories.sort(key=lambda x: x['name'])
    if '未分类' in cat_count:
        categories.insert(0, {'name': '未分类', 'count': cat_count['未分类']})

    return files, categories


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        sys.stderr.write(f'[{self.address_string()}] {args[0]} {args[1]}\n')

    def _send_json(self, data, status=200):
        body = json.dumps(data, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', len(body))
        self.send_header('Access-Control-Allow-Origin', ALLOWED_ORIGIN)
        self.end_headers()
        self.wfile.write(body)

    def _serve_static(self, path):
        if path == '/':
            path = '/index.html'
        file_path = os.path.realpath(os.path.normpath(ROOT_DIR + os.sep + path.lstrip('/').replace('/', os.sep)))
        if not file_path.startswith(ROOT_DIR_REAL + os.sep) and file_path != ROOT_DIR_REAL:
            self.send_error(403)
            return
        if not os.path.isfile(file_path):
            self.send_error(404, f'File not found: {path}')
            return
        ext = os.path.splitext(file_path)[1].lower()
        content_type = MIME_TYPES.get(ext, 'application/octet-stream')
        with open(file_path, 'rb') as f:
            data = f.read()
        self.send_response(200)
        self.send_header('Content-Type', content_type)
        self.send_header('Content-Length', len(data))
        self.send_header('Access-Control-Allow-Origin', ALLOWED_ORIGIN)
        self.end_headers()
        self.wfile.write(data)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', ALLOWED_ORIGIN)
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        path = self.path.split('?')[0]
        query = {}
        if '?' in self.path:
            from urllib.parse import parse_qs, urlparse
            query = {k: v[0] for k, v in parse_qs(urlparse(self.path).query).items()}

        if path == '/api/mocks':
            include_content = query.get('includeContent', '').lower() == 'true'
            files, categories = scan_mocks(include_content=include_content)
            self._send_json({'files': files, 'categories': categories, 'count': len(files), 'baseDir': MOCKS_DIR})
            return

        if path == '/api/read-fiddler':
            target = os.path.join(FIDDLER_SCRIPTS_DIR, 'CustomRules.js')
            if os.path.exists(target):
                with open(target, 'r', encoding='utf-8') as f:
                    content = f.read()
                self._send_json({'content': content})
            else:
                self._send_json({'content': ''})
            return

        if path == '/api/tracking-history/list':
            index = _load_tracking_index()
            self._send_json({'items': index})
            return

        self._serve_static(path)

    def do_POST(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length > MAX_BODY_SIZE:
                self._send_json({'error': f'请求体过大（最大 {MAX_BODY_SIZE // 1024 // 1024}MB）'}, 413)
                return
            body = self.rfile.read(content_length) if content_length > 0 else b'{}'
            data = json.loads(body.decode('utf-8'))
            path = self.path

            # ===== Mock 文件操作 =====
            if path == '/api/save-mock':
                fp = data.get('path', '')
                ct = data.get('content', '')
                if not fp:
                    self._send_json({'error': '缺少 path'}, 400)
                    return
                _safe_save_file(fp, ct)
                self._send_json({'ok': True, 'path': fp})
                return

            if path == '/api/save-mocks-batch':
                items = data.get('items', [])
                count = 0
                for item in items:
                    fp = item.get('path', '')
                    ct = item.get('content', '')
                    if fp and ct:
                        _safe_save_file(fp, ct)
                        count += 1
                self._send_json({'ok': True, 'saved': count})
                return

            if path == '/api/read-mock':
                file_path = data.get('path', '')
                if not file_path:
                    self._send_json({'error': '缺少 path'}, 400)
                    return
                if not _is_safe_path(file_path, MOCKS_DIR):
                    self._send_json({'error': '路径越权'}, 403)
                    return
                if os.path.exists(file_path):
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    self._send_json({'content': content, 'path': file_path})
                else:
                    self._send_json({'content': '', 'path': file_path})
                return

            if path == '/api/move-mock':
                old_path = data.get('oldPath', '')
                new_path = data.get('newPath', '')
                if not old_path or not new_path:
                    self._send_json({'error': '缺少路径'}, 400)
                    return
                if not _is_safe_path(old_path, MOCKS_DIR) or not _is_safe_path(new_path, MOCKS_DIR):
                    self._send_json({'error': '路径越权'}, 403)
                    return
                try:
                    os.makedirs(os.path.dirname(new_path), exist_ok=True)
                    shutil.move(old_path, new_path)
                    self._send_json({'ok': True, 'newPath': new_path})
                except Exception as e:
                    self._send_json({'error': str(e)}, 500)
                return

            if path == '/api/delete-mock':
                file_path = data.get('path', '')
                if not file_path:
                    self._send_json({'error': '缺少 path'}, 400)
                    return
                try:
                    _safe_delete_file(file_path)
                    self._send_json({'ok': True, 'path': file_path})
                except Exception as e:
                    self._send_json({'error': str(e)}, 500)
                return

            # ===== Fiddler 映射 =====
            if path == '/api/apply-fiddler':
                script = data.get('script', '')
                if not script:
                    self._send_json({'error': '缺少 script'}, 400)
                    return
                target = os.path.join(FIDDLER_SCRIPTS_DIR, 'CustomRules.js')
                os.makedirs(FIDDLER_SCRIPTS_DIR, exist_ok=True)
                try:
                    if os.path.exists(target):
                        os.chmod(target, 0o644)
                    _safe_save_file(target, script)
                    self._send_json({'ok': True, 'target': target})
                except PermissionError as e:
                    self._send_json({
                        'error': '文件被占用或无权限 - 请关闭 Fiddler 后再试',
                        'detail': str(e),
                        'target': target
                    }, 403)
                except Exception as e:
                    self._send_json({'error': str(e)}, 500)
                return

            # ===== 分类管理 =====
            if path == '/api/create-category':
                name = data.get('name', '')
                if not name:
                    self._send_json({'error': '缺少分类名'}, 400)
                    return
                cat_path = os.path.join(MOCKS_DIR, name)
                if not _is_safe_path(cat_path, MOCKS_DIR):
                    self._send_json({'error': '路径越权'}, 403)
                    return
                if os.path.exists(cat_path):
                    self._send_json({'error': '分类已存在'}, 400)
                    return
                os.makedirs(cat_path, exist_ok=True)
                self._send_json({'ok': True, 'path': cat_path})
                return

            if path == '/api/rename-category':
                old_name = data.get('oldName', '')
                new_name = data.get('newName', '')
                if not old_name or not new_name:
                    self._send_json({'error': '缺少分类名'}, 400)
                    return
                old_path = os.path.join(MOCKS_DIR, old_name)
                new_path = os.path.join(MOCKS_DIR, new_name)
                if not _is_safe_path(old_path, MOCKS_DIR) or not _is_safe_path(new_path, MOCKS_DIR):
                    self._send_json({'error': '路径越权'}, 403)
                    return
                if not os.path.exists(old_path):
                    self._send_json({'error': '原分类不存在'}, 400)
                    return
                if os.path.exists(new_path):
                    self._send_json({'error': '新分类名已存在'}, 400)
                    return
                os.rename(old_path, new_path)
                self._send_json({'ok': True, 'newPath': new_path})
                return

            if path == '/api/category/delete':
                name = data.get('name', '')
                if not name:
                    self._send_json({'error': '缺少分类名'}, 400)
                    return
                if name == '未分类':
                    self._send_json({'error': '不能删除"未分类"（请将文件移入子目录后自动消失）'}, 400)
                    return
                cat_path = os.path.join(MOCKS_DIR, name)
                if not _is_safe_path(cat_path, MOCKS_DIR):
                    self._send_json({'error': '路径越权'}, 403)
                    return
                if not os.path.exists(cat_path) or not os.path.isdir(cat_path):
                    self._send_json({'error': '分类不存在'}, 400)
                    return
                if len(os.listdir(cat_path)) > 0:
                    self._send_json({'error': '分类不为空，请先删除或移出所有文件'}, 400)
                    return
                os.rmdir(cat_path)
                self._send_json({'ok': True})
                return

            # ===== 埋点历史记录 API =====
            if path == '/api/tracking-history/check-duplicate':
                raw = data.get('raw', '')
                if not raw:
                    self._send_json({'duplicate': False})
                    return
                raw_hash = hashlib.sha256(raw.encode('utf-8')).hexdigest()
                index = _load_tracking_index()
                for e in index:
                    if e.get('raw_hash', '') == raw_hash:
                        self._send_json({'duplicate': True})
                        return
                self._send_json({'duplicate': False})
                return

            if path == '/api/tracking-history/save':
                records = data.get('records', [])
                raw = data.get('raw', '')
                fmt = data.get('format', '')
                if not records:
                    self._send_json({'error': '缺少 records'}, 400)
                    return
                # 服务端去重：计算完整 raw 的 SHA-256 hash
                raw_hash = hashlib.sha256(raw.encode('utf-8')).hexdigest() if raw else ''
                index = _load_tracking_index()
                for e in index:
                    if e.get('raw_hash', '') == raw_hash:
                        self._send_json({'duplicate': True, 'id': e['id']})
                        return
                entry_id = str(int(time.time() * 1000))
                entry = {
                    'id': entry_id,
                    'format': fmt,
                    'recordCount': len(records),
                    'eventNames': list(set(r.get('eventName', '') for r in records if r.get('eventName'))),
                    'raw_hash': raw_hash,
                    'records': records,
                    'createdAt': time.strftime('%Y-%m-%d %H:%M:%S')
                }
                _save_tracking_history_entry(entry_id, entry)
                index.insert(0, {
                    'id': entry_id,
                    'format': fmt,
                    'recordCount': len(records),
                    'eventNames': entry['eventNames'],
                    'raw_hash': raw_hash,
                    'createdAt': entry['createdAt']
                })
                # 最多保留 100 条
                if len(index) > 100:
                    removed = index[100:]
                    index = index[:100]
                    for r in removed:
                        _delete_tracking_history_file(r['id'])
                _save_tracking_index(index)
                self._send_json({'ok': True, 'id': entry_id})
                return

            if path == '/api/tracking-history/list':
                index = _load_tracking_index()
                self._send_json({'items': index})
                return

            if path == '/api/tracking-history/get':
                entry_id = data.get('id', '')
                if not entry_id:
                    self._send_json({'error': '缺少 id'}, 400)
                    return
                file_path = os.path.join(TRACKING_HISTORY_DIR, f'{entry_id}.json')
                if not os.path.exists(file_path):
                    self._send_json({'error': '历史记录不存在'}, 404)
                    return
                with open(file_path, 'r', encoding='utf-8') as f:
                    self._send_json({'entry': json.load(f)})
                return

            if path == '/api/tracking-history/delete':
                entry_id = data.get('id', '')
                if not entry_id:
                    self._send_json({'error': '缺少 id'}, 400)
                    return
                _delete_tracking_history_file(entry_id)
                index = _load_tracking_index()
                index = [e for e in index if e['id'] != entry_id]
                _save_tracking_index(index)
                self._send_json({'ok': True})
                return

            if path == '/api/tracking-history/clear':
                index = _load_tracking_index()
                for e in index:
                    _delete_tracking_history_file(e['id'])
                _save_tracking_index([])
                self._send_json({'ok': True})
                return

            self._send_json({'error': 'Not found'}, 404)
        except Exception as e:
            import traceback
            error_msg = f'[POST Error] {e}\n{traceback.format_exc()}'
            sys.stderr.write(error_msg)
            log_file = os.path.join(ROOT_DIR, 'server_error.log')
            with open(log_file, 'a', encoding='utf-8') as f:
                f.write(error_msg + '\n')
            self._send_json({'error': str(e)}, 500)


if __name__ == '__main__':
    print(f'Mock存储目录: {MOCKS_DIR}')
    print(f'Fiddler目录: {FIDDLER_SCRIPTS_DIR}')
    print(f'服务端口: {PORT}')
    server = ThreadingHTTPServer(('127.0.0.1', PORT), Handler)
    print(f'\n服务已启动: http://localhost:{PORT}')
    print('按 Ctrl+C 停止\n')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\n服务已停止')
        server.shutdown()
# AI-Generated End 1780595347
