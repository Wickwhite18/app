"""
Cell Tower OSINT Pro v13.0 — FastAPI Backend
Complete Multi-Source Intelligence Platform
"""
import os
import sys
import json
import re
import time
import math
import sqlite3
import hashlib
import urllib.parse
import urllib.request
import urllib.error
import ssl
import socket
import gzip
import threading
import random
import traceback
import logging
import pickle
import zlib
from logging.handlers import RotatingFileHandler
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Dict, List, Tuple, Optional, Any
from pathlib import Path
from datetime import datetime, timedelta, timezone
from collections import defaultdict
from fastapi import FastAPI, APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
import httpx
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from pydantic import BaseModel

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# ============================================================================
# ENHANCED LOGGING SYSTEM
# ============================================================================
class EnhancedLogger:
    def __init__(self, name="cell_tower_osint", log_dir="logs"):
        self.log_dir = Path(log_dir)
        self.log_dir.mkdir(exist_ok=True)
        self.logger = logging.getLogger(name)
        self.logger.setLevel(logging.DEBUG)
        self.logger.handlers = []
        console_handler = logging.StreamHandler()
        console_handler.setLevel(logging.INFO)
        console_formatter = logging.Formatter(
            '%(asctime)s - %(levelname)s - %(message)s', datefmt='%H:%M:%S'
        )
        console_handler.setFormatter(console_formatter)
        file_handler = RotatingFileHandler(
            self.log_dir / f"{name}.log", maxBytes=10*1024*1024, backupCount=5
        )
        file_handler.setLevel(logging.DEBUG)
        file_formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(funcName)s:%(lineno)d - %(message)s'
        )
        file_handler.setFormatter(file_formatter)
        error_handler = RotatingFileHandler(
            self.log_dir / f"{name}_errors.log", maxBytes=10*1024*1024, backupCount=5
        )
        error_handler.setLevel(logging.ERROR)
        error_handler.setFormatter(file_formatter)
        self.logger.addHandler(console_handler)
        self.logger.addHandler(file_handler)
        self.logger.addHandler(error_handler)

    def debug(self, msg): self.logger.debug(msg)
    def info(self, msg): self.logger.info(msg)
    def warning(self, msg): self.logger.warning(msg)
    def error(self, msg): self.logger.error(msg)
    def critical(self, msg): self.logger.critical(msg)


# ============================================================================
# CONFIGURATION MANAGER
# ============================================================================
class ConfigManager:
    DEFAULT_CONFIG = {
        "api_keys": {
            "opencellid": "",
            "unwiredlabs": "",
            "google_geolocation": "",
            "opencage": "",
            "abstractapi": "",
            "numverify": "",
            "ipqualityscore": "",
        },
        "scraping": {
            "user_agents": [
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15",
                "Mozilla/5.0 (X11; Linux x86_64; rv:120.0) Gecko/20100101 Firefox/120.0"
            ],
            "timeout": 30,
            "max_retries": 3,
            "retry_delay": 1.0,
            "max_concurrent": 10,
        },
        "settings": {
            "cache_enabled": True,
            "cache_ttl": 3600,
            "cache_compression": True,
            "rate_limit_enabled": True,
            "database_path": "data/cell_towers.db",
            "max_workers": 5
        },
        "rate_limits": {
            "opencellid": {"calls_per_minute": 60, "calls_per_day": 10000},
            "google_geolocation": {"calls_per_minute": 100, "calls_per_day": 100000},
            "unwiredlabs": {"calls_per_minute": 20, "calls_per_day": 5000},
            "opencage": {"calls_per_minute": 60, "calls_per_day": 2500},
            "abstractapi": {"calls_per_minute": 30, "calls_per_day": 1000},
            "numverify": {"calls_per_minute": 30, "calls_per_day": 1000},
            "ipqualityscore": {"calls_per_minute": 30, "calls_per_day": 1000},
            "default": {"calls_per_minute": 30, "calls_per_day": 1000}
        }
    }

    def __init__(self, config_file="config/api_config.json"):
        self.config_file = Path(config_file)
        self.config = self._load_config()
        self._validate_config()

    def _load_config(self) -> Dict:
        if self.config_file.exists():
            try:
                with open(self.config_file, 'r') as f:
                    user_config = json.load(f)
                    return self._merge_configs(self.DEFAULT_CONFIG.copy(), user_config)
            except Exception:
                return self.DEFAULT_CONFIG.copy()
        self.config_file.parent.mkdir(parents=True, exist_ok=True)
        self.save_config(self.DEFAULT_CONFIG)
        return self.DEFAULT_CONFIG.copy()

    def _merge_configs(self, default: Dict, user: Dict) -> Dict:
        for key, value in user.items():
            if key in default and isinstance(default[key], dict) and isinstance(value, dict):
                default[key] = self._merge_configs(default[key], value)
            else:
                default[key] = value
        return default

    def _validate_config(self):
        s = self.config.get("scraping", {})
        if not (1 <= s.get("max_retries", 3) <= 10):
            self.config["scraping"]["max_retries"] = 3
        if not (5 <= s.get("timeout", 30) <= 120):
            self.config["scraping"]["timeout"] = 30

    def save_config(self, config=None):
        config_to_save = config or self.config
        try:
            self.config_file.parent.mkdir(parents=True, exist_ok=True)
            with open(self.config_file, 'w') as f:
                json.dump(config_to_save, f, indent=4)
        except Exception as e:
            print(f"Error saving config: {e}")

    def get(self, key_path: str, default=None):
        keys = key_path.split('.')
        value = self.config
        for key in keys:
            if isinstance(value, dict) and key in value:
                value = value[key]
            else:
                return default
        return value


# ============================================================================
# RATE LIMITER
# ============================================================================
class RateLimiter:
    def __init__(self, config, logger):
        self.config = config
        self.logger = logger
        self.call_history = defaultdict(list)
        self.lock = threading.Lock()

    def can_make_request(self, service: str) -> Tuple[bool, Optional[float]]:
        if not self.config.get("settings.rate_limit_enabled", True):
            return True, None
        rate_limits = self.config.get(f"rate_limits.{service}") or self.config.get("rate_limits.default")
        with self.lock:
            now = time.time()
            history = self.call_history[service]
            history[:] = [t for t in history if now - t < 86400]
            recent_calls = [t for t in history if now - t < 60]
            if len(recent_calls) >= rate_limits["calls_per_minute"]:
                return False, 60 - (now - recent_calls[0])
            if len(history) >= rate_limits["calls_per_day"]:
                return False, 86400 - (now - history[0])
            return True, None

    def record_request(self, service: str):
        with self.lock:
            self.call_history[service].append(time.time())

    def wait_if_needed(self, service: str):
        allowed, wait_time = self.can_make_request(service)
        if not allowed and wait_time:
            self.logger.info(f"Rate limit for {service}. Waiting {wait_time:.1f}s")
            time.sleep(min(wait_time, 60))


# ============================================================================
# CACHE SYSTEM
# ============================================================================
class EnhancedCache:
    def __init__(self, config, logger):
        self.config = config
        self.logger = logger
        self.cache_dir = Path("cache")
        self.cache_dir.mkdir(exist_ok=True)
        self.memory_cache = {}
        self.cache_stats = {"hits": 0, "misses": 0}

    def _generate_key(self, url, method, params, data):
        key_parts = [url, method]
        if params:
            key_parts.append(json.dumps(params, sort_keys=True))
        if data:
            key_parts.append(json.dumps(data, sort_keys=True) if isinstance(data, dict) else str(data))
        return hashlib.sha256("|".join(str(p) for p in key_parts).encode()).hexdigest()[:32]

    def get(self, url, method, params=None, data=None):
        if not self.config.get("settings.cache_enabled", True):
            return None
        cache_key = self._generate_key(url, method, params, data)
        if cache_key in self.memory_cache:
            cd = self.memory_cache[cache_key]
            if self._is_valid(cd):
                self.cache_stats["hits"] += 1
                return cd["response"]
            else:
                del self.memory_cache[cache_key]
        cache_file = self.cache_dir / f"{cache_key}.cache"
        if cache_file.exists():
            try:
                with open(cache_file, 'rb') as f:
                    raw = f.read()
                if self.config.get("settings.cache_compression", True):
                    raw = zlib.decompress(raw)
                cd = pickle.loads(raw)
                if self._is_valid(cd):
                    self.memory_cache[cache_key] = cd
                    self.cache_stats["hits"] += 1
                    return cd["response"]
                else:
                    cache_file.unlink()
            except Exception:
                pass
        self.cache_stats["misses"] += 1
        return None

    def set(self, url, method, response, params=None, data=None):
        if not self.config.get("settings.cache_enabled", True):
            return
        cache_key = self._generate_key(url, method, params, data)
        cd = {"timestamp": time.time(), "response": response}
        self.memory_cache[cache_key] = cd
        try:
            raw = pickle.dumps(cd)
            if self.config.get("settings.cache_compression", True):
                raw = zlib.compress(raw, level=6)
            with open(self.cache_dir / f"{cache_key}.cache", 'wb') as f:
                f.write(raw)
        except Exception:
            pass

    def _is_valid(self, cd):
        return (time.time() - cd["timestamp"]) < self.config.get("settings.cache_ttl", 3600)

    def clear(self):
        self.memory_cache.clear()
        for f in self.cache_dir.glob("*.cache"):
            f.unlink()

    def clear_expired(self):
        removed = 0
        for f in self.cache_dir.glob("*.cache"):
            try:
                with open(f, 'rb') as fh:
                    raw = fh.read()
                if self.config.get("settings.cache_compression", True):
                    raw = zlib.decompress(raw)
                cd = pickle.loads(raw)
                if not self._is_valid(cd):
                    f.unlink()
                    removed += 1
            except Exception:
                f.unlink()
                removed += 1
        keys_to_remove = [k for k, v in self.memory_cache.items() if not self._is_valid(v)]
        for k in keys_to_remove:
            del self.memory_cache[k]
        removed += len(keys_to_remove)
        return removed

    def get_stats(self):
        total = self.cache_stats["hits"] + self.cache_stats["misses"]
        return {
            "hits": self.cache_stats["hits"],
            "misses": self.cache_stats["misses"],
            "hit_rate": (self.cache_stats["hits"] / total * 100) if total > 0 else 0,
            "memory_entries": len(self.memory_cache),
            "disk_entries": len(list(self.cache_dir.glob("*.cache")))
        }


# ============================================================================
# HTTP SESSION
# ============================================================================
class EnhancedHTTPSession:
    def __init__(self, config, logger):
        self.config = config
        self.logger = logger
        self.session_stats = defaultdict(lambda: {"requests": 0, "errors": 0, "total_time": 0.0})

    def make_request(self, url, method="GET", params=None, data=None,
                     headers=None, service=None, timeout=None):
        max_retries = self.config.get("scraping.max_retries", 3)
        retry_delay = self.config.get("scraping.retry_delay", 1.0)
        timeout = timeout or self.config.get("scraping.timeout", 30)
        request_headers = {
            "User-Agent": random.choice(self.config.get("scraping.user_agents", ["Mozilla/5.0"])),
            "Accept": "application/json, text/html, */*",
            "Accept-Encoding": "gzip, deflate",
            "Connection": "keep-alive"
        }
        if headers:
            request_headers.update(headers)
        if service:
            params, data = self._inject_api_key(service, params, data)
        start_time = time.time()
        last_error = None
        for attempt in range(max_retries):
            try:
                request_url = self._build_url(url, params, method)
                req = urllib.request.Request(request_url, headers=request_headers, method=method.upper())
                if method.upper() in ["POST", "PUT", "PATCH"] and data:
                    if isinstance(data, dict):
                        req.data = json.dumps(data).encode('utf-8')
                        req.add_header("Content-Type", "application/json")
                    elif isinstance(data, str):
                        req.data = data.encode('utf-8')
                    elif isinstance(data, bytes):
                        req.data = data
                ctx = ssl.create_default_context()
                ctx.check_hostname = False
                ctx.verify_mode = ssl.CERT_NONE
                with urllib.request.urlopen(req, timeout=timeout, context=ctx) as response:
                    content = response.read()
                    if response.headers.get('Content-Encoding') == 'gzip':
                        content = gzip.decompress(content)
                    encoding = response.info().get_content_charset('utf-8')
                    content_str = content.decode(encoding, errors='ignore')
                    self.session_stats[service or "unknown"]["requests"] += 1
                    self.session_stats[service or "unknown"]["total_time"] += time.time() - start_time
                    return {
                        "status": response.status,
                        "content": content_str,
                        "headers": dict(response.headers),
                        "url": response.url
                    }
            except urllib.error.HTTPError as e:
                last_error = e
                self.logger.warning(f"HTTP {e.code} for {url} (attempt {attempt+1}/{max_retries})")
                if e.code in [429, 503]:
                    time.sleep(retry_delay * (2 ** attempt))
                elif e.code >= 500 and attempt < max_retries - 1:
                    time.sleep(retry_delay * (attempt + 1))
                else:
                    break
            except (urllib.error.URLError, socket.timeout, ConnectionError) as e:
                last_error = e
                if attempt < max_retries - 1:
                    time.sleep(retry_delay * (2 ** attempt))
            except Exception as e:
                last_error = e
                break
        self.session_stats[service or "unknown"]["errors"] += 1
        return {"status": getattr(last_error, 'code', 0), "content": str(last_error), "error": str(last_error)}

    def _build_url(self, url, params, method):
        if method.upper() == "GET" and params:
            return f"{url}{'&' if '?' in url else '?'}{urllib.parse.urlencode(params)}"
        return url

    def _inject_api_key(self, service, params, data):
        api_key = self.config.get(f"api_keys.{service}")
        if not api_key:
            return params, data
        params = dict(params) if params else {}
        data = dict(data) if isinstance(data, dict) else data
        mapping = {
            "opencellid": ("params", "key"),
            "google_geolocation": ("params", "key"),
            "opencage": ("params", "key"),
            "abstractapi": ("params", "api_key"),
            "numverify": ("params", "access_key"),
            "unwiredlabs": ("data", "token"),
        }
        if service in mapping:
            loc, key_name = mapping[service]
            if loc == "params" and key_name:
                params[key_name] = api_key
            elif loc == "data" and key_name and isinstance(data, dict):
                data[key_name] = api_key
        return params, data

    def get_stats(self):
        stats = {}
        for service, d in self.session_stats.items():
            total = d["requests"] + d["errors"]
            stats[service] = {
                "total_requests": total,
                "successful": d["requests"],
                "errors": d["errors"],
                "success_rate": (d["requests"] / total * 100) if total > 0 else 0,
                "avg_response_time": (d["total_time"] / d["requests"]) if d["requests"] > 0 else 0
            }
        return stats


# ============================================================================
# API INTEGRATION
# ============================================================================
class EnhancedAPIIntegration:
    def __init__(self, config, logger):
        self.config = config
        self.logger = logger
        self.session = EnhancedHTTPSession(config, logger)
        self.cache = EnhancedCache(config, logger)
        self.rate_limiter = RateLimiter(config, logger)

    def make_request(self, url, method="GET", params=None, data=None,
                     headers=None, service=None, endpoint=None, use_cache=True):
        if use_cache:
            cached = self.cache.get(url, method, params, data)
            if cached:
                return cached
        if service:
            self.rate_limiter.wait_if_needed(service)
        response = self.session.make_request(url=url, method=method, params=params,
                                              data=data, headers=headers, service=service)
        if response and response.get("status") == 200 and use_cache:
            self.cache.set(url, method, response, params, data)
        if service and response and response.get("status") == 200:
            self.rate_limiter.record_request(service)
        return response

    def get_stats(self):
        return {
            "session": self.session.get_stats(),
            "cache": self.cache.get_stats(),
            "rate_limiter": {s: len(c) for s, c in self.rate_limiter.call_history.items()}
        }


# ============================================================================
# DATABASE MANAGER
# ============================================================================
class EnhancedDatabaseManager:
    def __init__(self, config, logger):
        self.config = config
        self.logger = logger
        self.db_path = Path(config.get("settings.database_path", "data/cell_towers.db"))
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_database()
        self._optimize_database()
        self._seed_demo_data()

    def _get_conn(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_database(self):
        conn = self._get_conn()
        c = conn.cursor()
        c.execute('''CREATE TABLE IF NOT EXISTS cell_towers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            mcc INTEGER NOT NULL, mnc INTEGER NOT NULL,
            lac INTEGER NOT NULL, cid INTEGER NOT NULL,
            lat REAL, lon REAL, range INTEGER DEFAULT 1000,
            samples INTEGER DEFAULT 1, average_signal INTEGER,
            radio_type TEXT, carrier TEXT, country TEXT,
            region TEXT, city TEXT, address TEXT,
            created INTEGER, updated INTEGER, source TEXT,
            confidence REAL DEFAULT 0.5,
            last_verified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            altitude INTEGER, accuracy INTEGER, azimuth INTEGER,
            is_active BOOLEAN DEFAULT 1,
            UNIQUE(mcc, mnc, lac, cid)
        )''')
        c.execute('''CREATE TABLE IF NOT EXISTS tower_measurements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tower_id INTEGER, signal_strength INTEGER,
            latitude REAL, longitude REAL, accuracy REAL,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP, source TEXT,
            FOREIGN KEY (tower_id) REFERENCES cell_towers(id) ON DELETE CASCADE
        )''')
        c.execute('''CREATE TABLE IF NOT EXISTS analysis_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            phone_number TEXT, analysis_type TEXT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            confidence_score REAL, results_json TEXT, processing_time REAL
        )''')
        c.execute('''CREATE TABLE IF NOT EXISTS api_usage (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            service TEXT, endpoint TEXT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            status_code INTEGER, response_time REAL,
            cached BOOLEAN DEFAULT 0, error TEXT
        )''')
        conn.commit()
        conn.close()

    def _optimize_database(self):
        conn = self._get_conn()
        c = conn.cursor()
        indexes = [
            "CREATE INDEX IF NOT EXISTS idx_tower_location ON cell_towers(lat, lon)",
            "CREATE INDEX IF NOT EXISTS idx_tower_mcc_mnc ON cell_towers(mcc, mnc)",
            "CREATE INDEX IF NOT EXISTS idx_tower_lac ON cell_towers(lac)",
            "CREATE INDEX IF NOT EXISTS idx_tower_cid ON cell_towers(cid)",
            "CREATE INDEX IF NOT EXISTS idx_tower_carrier ON cell_towers(carrier)",
            "CREATE INDEX IF NOT EXISTS idx_tower_confidence ON cell_towers(confidence)",
            "CREATE INDEX IF NOT EXISTS idx_tower_active ON cell_towers(is_active)",
            "CREATE INDEX IF NOT EXISTS idx_history_phone ON analysis_history(phone_number)",
            "CREATE INDEX IF NOT EXISTS idx_history_time ON analysis_history(timestamp)",
            "CREATE INDEX IF NOT EXISTS idx_api_service ON api_usage(service)",
            "CREATE INDEX IF NOT EXISTS idx_api_time ON api_usage(timestamp)",
        ]
        for sql in indexes:
            try:
                c.execute(sql)
            except Exception:
                pass
        c.execute("ANALYZE")
        conn.commit()
        conn.close()

    def _seed_demo_data(self):
        conn = self._get_conn()
        c = conn.cursor()
        c.execute("SELECT COUNT(*) as cnt FROM cell_towers")
        if c.fetchone()["cnt"] > 0:
            conn.close()
            return
        now = int(time.time())
        demo_towers = [
            (310, 260, 7033, 17811, 38.9072, -77.0369, 500, 45, -65, "LTE", "T-Mobile", "United States", "DC", "Washington", None, now, now, "demo", 0.85, 1),
            (310, 410, 7033, 18201, 38.8951, -77.0364, 800, 32, -72, "LTE", "AT&T", "United States", "DC", "Washington", None, now, now, "demo", 0.78, 1),
            (310, 4, 7033, 19102, 38.9101, -77.0420, 600, 28, -68, "LTE", "Verizon", "United States", "DC", "Washington", None, now, now, "demo", 0.82, 1),
            (310, 260, 7034, 20501, 40.7128, -74.0060, 400, 67, -60, "LTE", "T-Mobile", "United States", "NY", "New York", None, now, now, "demo", 0.92, 1),
            (310, 410, 7034, 21303, 40.7580, -73.9855, 350, 89, -55, "5G", "AT&T", "United States", "NY", "New York", None, now, now, "demo", 0.95, 1),
            (310, 4, 7034, 22104, 40.7484, -73.9856, 450, 54, -62, "LTE", "Verizon", "United States", "NY", "New York", None, now, now, "demo", 0.88, 1),
            (234, 15, 100, 30001, 51.5074, -0.1278, 700, 38, -70, "LTE", "Vodafone", "United Kingdom", "London", "London", None, now, now, "demo", 0.76, 1),
            (234, 30, 100, 30102, 51.5155, -0.1420, 550, 41, -67, "LTE", "EE", "United Kingdom", "London", "London", None, now, now, "demo", 0.80, 1),
            (234, 10, 100, 30203, 51.5030, -0.1195, 650, 35, -71, "LTE", "O2", "United Kingdom", "London", "London", None, now, now, "demo", 0.74, 1),
            (262, 1, 200, 40001, 52.5200, 13.4050, 600, 42, -66, "LTE", "Telekom", "Germany", "Berlin", "Berlin", None, now, now, "demo", 0.81, 1),
            (262, 2, 200, 40102, 52.5230, 13.4100, 500, 37, -69, "LTE", "Vodafone", "Germany", "Berlin", "Berlin", None, now, now, "demo", 0.77, 1),
            (310, 260, 8001, 50001, 34.0522, -118.2437, 450, 56, -61, "5G", "T-Mobile", "United States", "CA", "Los Angeles", None, now, now, "demo", 0.90, 1),
            (310, 410, 8001, 50102, 34.0195, -118.4912, 380, 72, -58, "5G", "AT&T", "United States", "CA", "Los Angeles", None, now, now, "demo", 0.93, 1),
            (310, 260, 9001, 60001, 41.8781, -87.6298, 520, 44, -64, "LTE", "T-Mobile", "United States", "IL", "Chicago", None, now, now, "demo", 0.84, 1),
            (310, 4, 9001, 60102, 41.8827, -87.6233, 480, 51, -63, "LTE", "Verizon", "United States", "IL", "Chicago", None, now, now, "demo", 0.86, 1),
        ]
        for t in demo_towers:
            try:
                c.execute('''INSERT OR IGNORE INTO cell_towers
                    (mcc,mnc,lac,cid,lat,lon,range,samples,average_signal,radio_type,carrier,country,region,city,address,created,updated,source,confidence,is_active)
                    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)''', t)
            except Exception:
                pass
        # Seed some demo analysis history
        demo_analyses = [
            ("+1 555 123 4567", "standard", 45.0, '{"phone_number":"+1 555 123 4567"}', 1.2),
            ("+44 20 7946 0958", "deep_scan", 62.5, '{"phone_number":"+44 20 7946 0958"}', 3.8),
            ("+49 30 901820", "standard", 35.0, '{"phone_number":"+49 30 901820"}', 0.9),
            ("+1 212 555 0100", "deep_scan", 78.0, '{"phone_number":"+1 212 555 0100"}', 4.2),
            ("+1 310 555 0199", "standard", 55.0, '{"phone_number":"+1 310 555 0199"}', 1.5),
        ]
        for a in demo_analyses:
            try:
                c.execute('''INSERT INTO analysis_history
                    (phone_number, analysis_type, confidence_score, results_json, processing_time)
                    VALUES (?,?,?,?,?)''', a)
            except Exception:
                pass
        conn.commit()
        conn.close()

    def save_tower(self, tower_data):
        conn = self._get_conn()
        c = conn.cursor()
        try:
            c.execute('SELECT id, samples FROM cell_towers WHERE mcc=? AND mnc=? AND lac=? AND cid=?',
                       (tower_data["mcc"], tower_data["mnc"], tower_data["lac"], tower_data["cid"]))
            existing = c.fetchone()
            now = int(time.time())
            if existing:
                tid, old_samples = existing["id"], existing["samples"]
                new_samples = old_samples + tower_data.get("samples", 1)
                confidence = min((new_samples / 100.0) + 0.3, 1.0)
                c.execute('''UPDATE cell_towers SET lat=COALESCE(?,lat), lon=COALESCE(?,lon),
                    range=COALESCE(?,range), samples=?, radio_type=COALESCE(?,radio_type),
                    carrier=COALESCE(?,carrier), country=COALESCE(?,country),
                    updated=?, source=COALESCE(?,source), confidence=?,
                    last_verified=CURRENT_TIMESTAMP WHERE id=?''',
                    (tower_data.get("lat"), tower_data.get("lon"), tower_data.get("range", 1000),
                     new_samples, tower_data.get("radio_type"), tower_data.get("carrier"),
                     tower_data.get("country"), now, tower_data.get("source"), confidence, tid))
                conn.commit()
                return tid
            else:
                c.execute('''INSERT INTO cell_towers (mcc,mnc,lac,cid,lat,lon,range,samples,
                    radio_type,carrier,country,created,updated,source,confidence)
                    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)''',
                    (tower_data["mcc"], tower_data["mnc"], tower_data["lac"], tower_data["cid"],
                     tower_data.get("lat"), tower_data.get("lon"), tower_data.get("range", 1000),
                     tower_data.get("samples", 1), tower_data.get("radio_type"),
                     tower_data.get("carrier"), tower_data.get("country"),
                     now, now, tower_data.get("source"), 0.5))
                conn.commit()
                return c.lastrowid
        except Exception as e:
            self.logger.error(f"Save tower error: {e}")
            conn.rollback()
            return None
        finally:
            conn.close()

    def get_towers_in_area(self, lat, lon, radius_km, mcc=None, mnc=None):
        conn = self._get_conn()
        c = conn.cursor()
        try:
            lat_range = radius_km / 111.0
            lon_range = radius_km / (111.0 * max(math.cos(math.radians(lat)), 0.01))
            query = '''SELECT *, 
                (6371 * acos(min(max(cos(radians(?)) * cos(radians(lat)) * 
                cos(radians(lon) - radians(?)) + sin(radians(?)) * sin(radians(lat)), -1), 1))) AS distance
                FROM cell_towers WHERE lat BETWEEN ? AND ? AND lon BETWEEN ? AND ?
                AND is_active = 1'''
            params = [lat, lon, lat, lat - lat_range, lat + lat_range,
                      lon - lon_range, lon + lon_range]
            if mcc:
                query += " AND mcc = ?"
                params.append(mcc)
            if mnc:
                query += " AND mnc = ?"
                params.append(mnc)
            query += " ORDER BY distance LIMIT 100"
            c.execute(query, params)
            rows = c.fetchall()
            return [dict(r) for r in rows if r["distance"] is None or r["distance"] <= radius_km]
        except Exception as e:
            self.logger.error(f"Area search error: {e}")
            return []
        finally:
            conn.close()

    def get_tower_by_cell_id(self, mcc, mnc, lac, cid):
        conn = self._get_conn()
        try:
            c = conn.cursor()
            c.execute('SELECT * FROM cell_towers WHERE mcc=? AND mnc=? AND lac=? AND cid=?',
                       (mcc, mnc, lac, cid))
            row = c.fetchone()
            return dict(row) if row else None
        finally:
            conn.close()

    def record_analysis(self, phone_number, analysis_type, confidence_score, results, processing_time):
        conn = self._get_conn()
        try:
            conn.execute('''INSERT INTO analysis_history
                (phone_number, analysis_type, confidence_score, results_json, processing_time)
                VALUES (?,?,?,?,?)''',
                (phone_number, analysis_type, confidence_score,
                 json.dumps(results, default=str), processing_time))
            conn.commit()
        except Exception as e:
            self.logger.error(f"Record analysis error: {e}")
        finally:
            conn.close()

    def get_statistics(self):
        conn = self._get_conn()
        c = conn.cursor()
        try:
            stats = {}
            c.execute("SELECT COUNT(*) as cnt FROM cell_towers WHERE is_active=1")
            stats["total_towers"] = c.fetchone()["cnt"]
            c.execute("SELECT COUNT(DISTINCT carrier) as cnt FROM cell_towers WHERE carrier IS NOT NULL")
            stats["unique_carriers"] = c.fetchone()["cnt"]
            c.execute("SELECT COUNT(DISTINCT mcc) as cnt FROM cell_towers")
            stats["unique_countries"] = c.fetchone()["cnt"]
            c.execute("SELECT COUNT(*) as cnt FROM cell_towers WHERE confidence >= 0.7")
            stats["high_confidence_towers"] = c.fetchone()["cnt"]
            c.execute("SELECT AVG(confidence) as avg FROM cell_towers")
            stats["avg_confidence"] = c.fetchone()["avg"] or 0
            c.execute("SELECT COUNT(*) as cnt FROM tower_measurements")
            stats["total_measurements"] = c.fetchone()["cnt"]
            c.execute("SELECT COUNT(*) as cnt FROM analysis_history")
            stats["total_analyses"] = c.fetchone()["cnt"]
            yesterday = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
            c.execute("SELECT COUNT(*) as cnt FROM analysis_history WHERE timestamp >= ?", (yesterday,))
            stats["recent_analyses"] = c.fetchone()["cnt"]
            today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0).isoformat()
            c.execute("SELECT COUNT(*) as cnt FROM api_usage WHERE timestamp >= ?", (today,))
            stats["api_usage_today"] = c.fetchone()["cnt"]
            # Radio type breakdown
            c.execute("SELECT radio_type, COUNT(*) as cnt FROM cell_towers WHERE radio_type IS NOT NULL GROUP BY radio_type")
            stats["radio_breakdown"] = {row["radio_type"]: row["cnt"] for row in c.fetchall()}
            # Top carriers
            c.execute("SELECT carrier, COUNT(*) as cnt FROM cell_towers WHERE carrier IS NOT NULL GROUP BY carrier ORDER BY cnt DESC LIMIT 10")
            stats["top_carriers"] = [{"carrier": row["carrier"], "count": row["cnt"]} for row in c.fetchall()]
            return stats
        finally:
            conn.close()

    def get_recent_analyses(self, limit=20):
        conn = self._get_conn()
        try:
            c = conn.cursor()
            c.execute("SELECT id, phone_number, analysis_type, timestamp, confidence_score, processing_time FROM analysis_history ORDER BY timestamp DESC LIMIT ?", (limit,))
            return [dict(r) for r in c.fetchall()]
        finally:
            conn.close()

    def get_all_towers(self, limit=100, offset=0):
        conn = self._get_conn()
        try:
            c = conn.cursor()
            c.execute("SELECT * FROM cell_towers WHERE is_active=1 ORDER BY updated DESC LIMIT ? OFFSET ?", (limit, offset))
            return [dict(r) for r in c.fetchall()]
        finally:
            conn.close()


# ============================================================================
# PHONE INTELLIGENCE
# ============================================================================
class EnhancedPhoneIntelligence:
    def __init__(self, api_integration, database, logger):
        self.api = api_integration
        self.db = database
        self.logger = logger
        self.mcc_mnc_database = {
            "310": {"country": "United States", "carriers": {
                "004": "Verizon", "012": "Verizon", "150": "AT&T",
                "410": "AT&T", "260": "T-Mobile", "160": "T-Mobile",
            }},
            "234": {"country": "United Kingdom", "carriers": {
                "015": "Vodafone", "030": "EE", "010": "O2", "020": "Three",
            }},
            "262": {"country": "Germany", "carriers": {
                "001": "Telekom", "002": "Vodafone", "007": "O2",
            }},
        }

    def analyze_phone_number(self, phone_number, deep_scan=False):
        self.logger.info(f"Analyzing {phone_number}")
        start_time = time.time()
        results = {
            "phone_number": phone_number,
            "analysis_timestamp": datetime.now(timezone.utc).isoformat(),
            "basic_info": {}, "validation": {}, "risk_assessment": {},
            "carrier_info": {}, "location_intelligence": {},
            "tower_data": {}, "geolocation": {},
            "confidence_score": 0.0, "processing_steps": []
        }
        try:
            results["processing_steps"].append("Parsing phone number")
            results["basic_info"] = self._parse_phone_number(phone_number)
            if not results["basic_info"].get("valid_format"):
                results["processing_steps"].append("Invalid format detected")
                results["confidence_score"] = self._calculate_confidence(results)
                return results
            results["processing_steps"].append("Validating number")
            results["validation"] = self._validate_phone_number(phone_number)
            results["processing_steps"].append("Assessing risk level")
            results["risk_assessment"] = self._assess_phone_risk(phone_number)
            results["processing_steps"].append("Identifying carrier")
            results["carrier_info"] = self._identify_carrier(
                phone_number, results["validation"], results["basic_info"])
            results["processing_steps"].append("Estimating location")
            results["location_intelligence"] = self._estimate_location(
                phone_number, results["validation"], results["carrier_info"])
            if results["location_intelligence"].get("estimated_location"):
                loc = results["location_intelligence"]["estimated_location"]
                results["processing_steps"].append("Fetching nearby cell towers")
                results["tower_data"] = self._fetch_cell_towers(
                    loc["lat"], loc["lon"],
                    results["carrier_info"].get("mcc"),
                    results["carrier_info"].get("mnc"))
                if results["tower_data"].get("towers") and len(results["tower_data"]["towers"]) >= 3:
                    results["processing_steps"].append("Triangulating position")
                    results["geolocation"] = self._triangulate_location(results["tower_data"]["towers"])
                    if deep_scan and results["geolocation"].get("best_location"):
                        bl = results["geolocation"]["best_location"]
                        results["processing_steps"].append("Reverse geocoding address")
                        results["location_intelligence"]["address"] = self._reverse_geocode(bl["lat"], bl["lon"])
            results["processing_steps"].append("Calculating confidence score")
            results["confidence_score"] = self._calculate_confidence(results)
            processing_time = time.time() - start_time
            results["processing_time"] = round(processing_time, 2)
            self.db.record_analysis(phone_number, "deep_scan" if deep_scan else "standard",
                                     results["confidence_score"], results, processing_time)
        except Exception as e:
            self.logger.error(f"Analysis error: {e}")
            results["error"] = str(e)
        return results

    def _parse_phone_number(self, phone_number):
        clean = re.sub(r'[^\d+]', '', phone_number)
        result = {"raw": phone_number, "clean": clean, "country_code": None,
                  "national_number": None, "formatted": phone_number, "valid_format": False}
        valid_codes = {'1','7','20','27','30','31','32','33','34','36','39','40','41','43','44',
                       '45','46','47','48','49','51','52','53','54','55','56','57','58','60','61',
                       '62','63','64','65','66','81','82','84','86','90','91','92','93','94','95','98'}
        if clean.startswith('+'):
            for cc_len in [3, 2, 1]:
                if len(clean) > cc_len + 1:
                    cc = clean[1:1+cc_len]
                    if cc in valid_codes:
                        result["country_code"] = cc
                        result["national_number"] = clean[1+cc_len:]
                        result["valid_format"] = True
                        result["formatted"] = f"+{cc} {result['national_number']}"
                        break
        elif len(clean) in [10, 11]:
            if len(clean) == 11 and clean.startswith('1'):
                result["country_code"] = '1'
                result["national_number"] = clean[1:]
            elif len(clean) == 10:
                result["country_code"] = '1'
                result["national_number"] = clean
            if result["country_code"]:
                result["valid_format"] = True
                nn = result["national_number"]
                result["formatted"] = f"+1 ({nn[:3]}) {nn[3:6]}-{nn[6:]}"
        return result

    def _validate_phone_number(self, phone_number):
        results = {"valid": False, "services_checked": [], "line_type": None, "carrier": None, "country": None}
        try:
            resp = self.api.make_request(url="https://phonevalidation.abstractapi.com/v1/",
                                          params={"phone": phone_number}, service="abstractapi")
            if resp and resp.get("status") == 200:
                data = json.loads(resp["content"])
                results["services_checked"].append("abstractapi")
                if data.get("valid"):
                    results["valid"] = True
                    results["line_type"] = data.get("type")
                    results["carrier"] = data.get("carrier")
                    results["country"] = (data.get("country") or {}).get("name")
        except Exception:
            pass
        try:
            resp = self.api.make_request(url="http://apilayer.net/api/validate",
                                          params={"number": phone_number, "format": "1"}, service="numverify")
            if resp and resp.get("status") == 200:
                data = json.loads(resp["content"])
                results["services_checked"].append("numverify")
                if data.get("valid"):
                    results["valid"] = True
                    results["line_type"] = results["line_type"] or data.get("line_type")
                    results["carrier"] = results["carrier"] or data.get("carrier")
                    results["country"] = results["country"] or data.get("country_name")
        except Exception:
            pass
        return results

    def _assess_phone_risk(self, phone_number):
        results = {"risk_score": 0, "fraud_score": 0, "spam_score": 0,
                   "disposable": False, "risk_level": "low", "services_checked": []}
        try:
            api_key = self.api.config.get("api_keys.ipqualityscore")
            if api_key:
                resp = self.api.make_request(
                    url=f"https://ipqualityscore.com/api/json/phone/{api_key}/{phone_number}",
                    service="ipqualityscore")
                if resp and resp.get("status") == 200:
                    data = json.loads(resp["content"])
                    results["services_checked"].append("ipqualityscore")
                    results["risk_score"] = data.get("fraud_score", 0)
                    results["fraud_score"] = data.get("fraud_score", 0)
                    results["spam_score"] = data.get("spam_score", 0)
                    results["disposable"] = data.get("prepaid", False)
                    if results["risk_score"] >= 80: results["risk_level"] = "critical"
                    elif results["risk_score"] >= 60: results["risk_level"] = "high"
                    elif results["risk_score"] >= 40: results["risk_level"] = "medium"
        except Exception:
            pass
        return results

    def _identify_carrier(self, phone_number, validation, basic_info):
        results = {"carrier": None, "mcc": None, "mnc": None, "line_type": None, "country": None}
        results["carrier"] = validation.get("carrier")
        results["line_type"] = validation.get("line_type")
        results["country"] = validation.get("country")
        cc = basic_info.get("country_code")
        mcc_map = {"1": "310", "44": "234", "49": "262", "33": "208",
                   "39": "222", "34": "214", "86": "460", "91": "404", "81": "440", "82": "450"}
        if cc:
            mcc = mcc_map.get(cc)
            if mcc:
                results["mcc"] = mcc
                if results["carrier"] and mcc in self.mcc_mnc_database:
                    carrier_lower = results["carrier"].lower()
                    for mnc, name in self.mcc_mnc_database[mcc].get("carriers", {}).items():
                        if name.lower() in carrier_lower or carrier_lower in name.lower():
                            results["mnc"] = mnc
                            break
        return results

    def _estimate_location(self, phone_number, validation, carrier_info):
        results = {"country": None, "estimated_location": None, "accuracy_km": 50, "sources": []}
        results["country"] = validation.get("country") or carrier_info.get("country")
        capitals = {"United States": (38.9, -77.0), "United Kingdom": (51.5, -0.1),
                     "Germany": (52.5, 13.4), "France": (48.9, 2.3), "Japan": (35.7, 139.7),
                     "China": (39.9, 116.4), "India": (28.6, 77.2), "Italy": (41.9, 12.5),
                     "Spain": (40.4, -3.7), "South Korea": (37.6, 127.0)}
        country = results["country"]
        if country and country in capitals:
            lat, lon = capitals[country]
            results["estimated_location"] = {"lat": lat, "lon": lon}
            results["sources"].append("country_capital")
        return results

    def _fetch_cell_towers(self, lat, lon, mcc=None, mnc=None, radius_km=10):
        results = {"search_location": {"lat": lat, "lon": lon}, "towers": [], "total_found": 0, "sources": []}
        db_towers = self.db.get_towers_in_area(lat, lon, radius_km,
                                                int(mcc) if mcc else None,
                                                int(mnc) if mnc else None)
        if db_towers:
            results["towers"].extend(db_towers)
            results["sources"].append("local_database")
        try:
            resp = self.api.make_request(
                url="https://opencellid.org/cell/getInArea",
                params={"lat": lat, "lng": lon, "radius": radius_km, "format": "json"},
                service="opencellid")
            if resp and resp.get("status") == 200:
                data = json.loads(resp["content"])
                if data.get("cells"):
                    results["sources"].append("opencellid")
                    for cell in data["cells"]:
                        tower = {"mcc": cell.get("mcc"), "mnc": cell.get("mnc"),
                                 "lac": cell.get("lac"), "cid": cell.get("cellid"),
                                 "lat": cell.get("lat"), "lon": cell.get("lon"),
                                 "range": cell.get("range", 1000),
                                 "samples": cell.get("samples", 1),
                                 "radio_type": cell.get("radioType", "gsm"),
                                 "source": "opencellid"}
                        results["towers"].append(tower)
                        self.db.save_tower(tower)
        except Exception:
            pass
        results["total_found"] = len(results["towers"])
        return results

    def _triangulate_location(self, towers):
        results = {"towers_used": len(towers), "location_methods": [], "best_location": None, "confidence": 0.0}
        if len(towers) < 3:
            return results
        total_weight = weighted_lat = weighted_lon = 0
        for t in towers[:10]:
            if t.get("lat") and t.get("lon"):
                w = t.get("samples", 1) / max(t.get("range", 1000), 100)
                weighted_lat += t["lat"] * w
                weighted_lon += t["lon"] * w
                total_weight += w
        if total_weight > 0:
            results["location_methods"].append({
                "lat": weighted_lat / total_weight, "lon": weighted_lon / total_weight,
                "accuracy": 500, "source": "weighted_centroid", "confidence": 0.7
            })
        try:
            cell_towers_payload = [{"cellId": t.get("cid"), "locationAreaCode": t.get("lac"),
                                     "mobileCountryCode": t.get("mcc"), "mobileNetworkCode": t.get("mnc"),
                                     "signalStrength": t.get("average_signal", -70)} for t in towers[:5]]
            resp = self.api.make_request(
                url="https://www.googleapis.com/geolocation/v1/geolocate",
                method="POST", data=json.dumps({"considerIp": "false", "cellTowers": cell_towers_payload}),
                headers={"Content-Type": "application/json"},
                service="google_geolocation")
            if resp and resp.get("status") == 200:
                data = json.loads(resp["content"])
                if data.get("location"):
                    results["location_methods"].append({
                        "lat": data["location"]["lat"], "lon": data["location"]["lng"],
                        "accuracy": data.get("accuracy", 1000),
                        "source": "google_geolocation", "confidence": 0.95
                    })
        except Exception:
            pass
        if results["location_methods"]:
            best = max(results["location_methods"], key=lambda x: x["confidence"])
            results["best_location"] = best
            results["confidence"] = best["confidence"]
        return results

    def _reverse_geocode(self, lat, lon):
        results = {"formatted": "", "components": {}, "sources": []}
        try:
            resp = self.api.make_request(
                url="https://api.opencagedata.com/geocode/v1/json",
                params={"q": f"{lat},{lon}", "no_annotations": 1},
                service="opencage")
            if resp and resp.get("status") == 200:
                data = json.loads(resp["content"])
                if data.get("results"):
                    r = data["results"][0]
                    results["formatted"] = r.get("formatted", "")
                    results["components"] = r.get("components", {})
                    results["sources"].append("opencage")
        except Exception:
            pass
        return results

    def _calculate_confidence(self, results):
        score = 0.0
        if results["validation"].get("valid"): score += 20
        if results["carrier_info"].get("carrier"): score += 15
        if results["location_intelligence"].get("estimated_location"): score += 15
        tc = results.get("tower_data", {}).get("total_found", 0)
        if tc >= 10: score += 20
        elif tc >= 5: score += 15
        elif tc >= 3: score += 10
        elif tc >= 1: score += 5
        if results.get("geolocation", {}).get("best_location"): score += 20
        return min(score, 100.0)


# ============================================================================
# INITIALIZE BACKEND
# ============================================================================
osint_config = ConfigManager()
osint_logger = EnhancedLogger()
osint_api = EnhancedAPIIntegration(osint_config, osint_logger)
osint_db = EnhancedDatabaseManager(osint_config, osint_logger)
phone_intel = EnhancedPhoneIntelligence(osint_api, osint_db, osint_logger)

# ============================================================================
# FASTAPI APP
# ============================================================================
app = FastAPI(title="Cell Tower OSINT Pro v13.0")
api_router = APIRouter(prefix="/api")


# ---- Pydantic Models ----
class PhoneAnalysisRequest(BaseModel):
    phone: str
    deep_scan: bool = False

class TowerLookupRequest(BaseModel):
    mcc: int
    mnc: int
    lac: int
    cid: int

class AreaSearchRequest(BaseModel):
    lat: float
    lon: float
    radius: float = 10.0
    mcc: Optional[int] = None
    mnc: Optional[int] = None

class APIKeyUpdate(BaseModel):
    keys: Dict[str, str]

class CacheAction(BaseModel):
    action: str


def _geoengine_configuration() -> Tuple[str, str, str]:
    """Return the configured upstream service without ever exposing its key."""
    url = os.environ.get("GEOENGINE_API_URL", "").rstrip("/")
    key = os.environ.get("GEOENGINE_API_KEY", "")
    key_header = os.environ.get("GEOENGINE_API_KEY_HEADER", "x-api-key").lower()
    if not url:
        raise HTTPException(
            status_code=503,
            detail="Geoengine backend is not configured. Set GEOENGINE_API_URL on the server.",
        )
    parsed_url = urllib.parse.urlparse(url)
    if parsed_url.scheme not in {"http", "https"} or not parsed_url.netloc:
        raise HTTPException(status_code=500, detail="GEOENGINE_API_URL must be an absolute HTTP(S) URL")
    if not re.fullmatch(r"[a-z0-9-]+", key_header):
        raise HTTPException(status_code=500, detail="GEOENGINE_API_KEY_HEADER is invalid")
    return url, key, key_header


@api_router.api_route(
    "/geoengine/{upstream_path:path}",
    methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
)
async def proxy_geoengine(request: Request, upstream_path: str):
    """Proxy Geoengine calls so browser clients never receive the service key."""
    base_url, api_key, key_header = _geoengine_configuration()
    url = f"{base_url}/{upstream_path.lstrip('/')}"
    headers = {"accept": request.headers.get("accept", "application/json")}
    content_type = request.headers.get("content-type")
    if content_type:
        headers["content-type"] = content_type
    if api_key:
        headers[key_header] = api_key

    client = httpx.AsyncClient(timeout=30.0)
    try:
        upstream_request = client.build_request(
            request.method,
            url,
            params=request.query_params,
            content=await request.body(),
            headers=headers,
        )
        upstream = await client.send(upstream_request, stream=True)
    except httpx.HTTPError as exc:
        await client.aclose()
        raise HTTPException(status_code=503, detail="Geoengine backend is unreachable") from exc

    response_headers = {}
    for header in ("content-disposition", "content-type"):
        if header in upstream.headers:
            response_headers[header] = upstream.headers[header]
    async def response_body():
        try:
            async for chunk in upstream.aiter_raw():
                yield chunk
        finally:
            await upstream.aclose()
            await client.aclose()

    return StreamingResponse(
        response_body(),
        status_code=upstream.status_code,
        headers=response_headers,
    )


# ---- API Routes ----
@api_router.get("/")
async def root():
    return {"message": "Cell Tower OSINT Pro v13.0", "status": "operational", "developer": "Mr~Wh!te"}


@api_router.post("/analyze")
async def analyze_phone(req: PhoneAnalysisRequest):
    if not req.phone.strip():
        raise HTTPException(status_code=400, detail="Phone number required")
    results = phone_intel.analyze_phone_number(req.phone.strip(), req.deep_scan)
    return results


@api_router.post("/tower/lookup")
async def tower_lookup(req: TowerLookupRequest):
    tower = osint_db.get_tower_by_cell_id(req.mcc, req.mnc, req.lac, req.cid)
    if not tower:
        try:
            resp = osint_api.make_request(
                url="https://opencellid.org/cell/get",
                params={"mcc": req.mcc, "mnc": req.mnc, "lac": req.lac, "cellid": req.cid, "format": "json"},
                service="opencellid")
            if resp and resp.get("status") == 200:
                data = json.loads(resp["content"])
                if data.get("lat"):
                    tower_data = {"mcc": req.mcc, "mnc": req.mnc, "lac": req.lac, "cid": req.cid,
                                  "lat": data["lat"], "lon": data["lon"],
                                  "range": data.get("range", 1000),
                                  "samples": data.get("samples", 1),
                                  "radio_type": data.get("radioType", "gsm"),
                                  "source": "opencellid"}
                    osint_db.save_tower(tower_data)
                    tower = tower_data
        except Exception:
            pass
    if tower:
        return {"found": True, "tower": tower}
    return {"found": False, "tower": None}


@api_router.post("/area/search")
async def area_search(req: AreaSearchRequest):
    towers = osint_db.get_towers_in_area(
        req.lat, req.lon, req.radius,
        req.mcc, req.mnc
    )
    return {"towers": towers, "total": len(towers), "search": {"lat": req.lat, "lon": req.lon, "radius": req.radius}}


@api_router.get("/stats")
async def get_stats():
    stats = osint_db.get_statistics()
    api_stats = osint_api.get_stats()
    return {
        "database": stats,
        "api": api_stats,
    }


@api_router.get("/stats/recent")
async def get_recent():
    return {"analyses": osint_db.get_recent_analyses(20)}


@api_router.get("/towers")
async def get_towers(limit: int = 100, offset: int = 0):
    return {"towers": osint_db.get_all_towers(limit, offset)}


@api_router.get("/settings")
async def get_settings():
    keys = {}
    for k, v in osint_config.config["api_keys"].items():
        keys[k] = {"configured": bool(v), "masked": f"{'*' * 8}...{v[-4:]}" if len(v) > 4 else ("***" if v else "")}
    return {"api_keys": keys, "settings": osint_config.config.get("settings", {})}


@api_router.post("/settings")
async def update_settings(req: APIKeyUpdate):
    for key, val in req.keys.items():
        if key in osint_config.config["api_keys"] and val.strip():
            osint_config.config["api_keys"][key] = val.strip()
    osint_config.save_config()
    return {"status": "saved", "message": "API keys updated successfully"}


@api_router.get("/cache")
async def get_cache_stats():
    return osint_api.cache.get_stats()


@api_router.post("/cache/clear")
async def clear_cache(req: CacheAction):
    if req.action == "clear_all":
        osint_api.cache.clear()
        return {"status": "cleared", "message": "All cache cleared"}
    elif req.action == "clear_expired":
        removed = osint_api.cache.clear_expired()
        return {"status": "cleared", "removed": removed, "message": f"Removed {removed} expired entries"}
    raise HTTPException(status_code=400, detail="Invalid action")


@api_router.get("/export/towers")
async def export_towers():
    towers = osint_db.get_all_towers(limit=10000)
    return {"towers": towers, "exported_at": datetime.now(timezone.utc).isoformat(), "total": len(towers)}


@api_router.get("/export/analyses")
async def export_analyses():
    analyses = osint_db.get_recent_analyses(limit=1000)
    return {"analyses": analyses, "exported_at": datetime.now(timezone.utc).isoformat(), "total": len(analyses)}


# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown():
    osint_logger.info("Shutting down OSINT Pro v13.0")
