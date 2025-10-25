#!/usr/bin/env python3
"""
Simple Flask API server to serve live orders and whale data
Run this locally to serve JSON data to your Vercel webapp
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import json
import os
from pathlib import Path
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Paths to JSON files
CACHE_DIR = Path(__file__).parent.parent / '.cache'
ORDERS_FILE = CACHE_DIR / 'live_orders.json'
WHALES_FILE = CACHE_DIR / 'whales.json'

def load_json_file(file_path):
    """Load JSON data from file"""
    try:
        if file_path.exists():
            with open(file_path, 'r') as f:
                return json.load(f)
        return {"orders": [], "whales": [], "lastUpdate": 0}
    except Exception as e:
        print(f"Error loading {file_path}: {e}")
        return {"orders": [], "whales": [], "lastUpdate": 0}

@app.route('/api/orders', methods=['GET'])
def get_orders():
    """Get live orders data"""
    try:
        data = load_json_file(ORDERS_FILE)
        
        # Get query parameters
        limit = request.args.get('limit', 10, type=int)
        market_id = request.args.get('marketId')
        
        orders = data.get('orders', [])
        
        # Filter by market if specified
        if market_id:
            orders = [order for order in orders if order.get('marketId') == market_id]
        
        # Apply limit
        orders = orders[:limit]
        
        return jsonify({
            "orders": orders,
            "lastUpdate": data.get('lastUpdate', 0),
            "blockHeight": data.get('blockHeight', 0),
            "source": "local-api",
            "count": len(orders),
            "limit": limit,
            "marketId": market_id,
            "realData": True,
            "timestamp": int(datetime.now().timestamp() * 1000)
        })
        
    except Exception as e:
        print(f"Error in get_orders: {e}")
        return jsonify({
            "orders": [],
            "lastUpdate": 0,
            "source": "error",
            "error": str(e),
            "realData": False
        }), 500

@app.route('/api/whales', methods=['GET'])
def get_whales():
    """Get whale activity data"""
    try:
        data = load_json_file(WHALES_FILE)
        
        whales = data.get('whales', [])
        
        return jsonify({
            "whales": whales,
            "lastUpdate": data.get('lastUpdate', 0),
            "source": "local-api",
            "count": len(whales),
            "realData": True,
            "timestamp": int(datetime.now().timestamp() * 1000)
        })
        
    except Exception as e:
        print(f"Error in get_whales: {e}")
        return jsonify({
            "whales": [],
            "lastUpdate": 0,
            "source": "error",
            "error": str(e),
            "realData": False
        }), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "timestamp": int(datetime.now().timestamp() * 1000),
        "orders_file_exists": ORDERS_FILE.exists(),
        "whales_file_exists": WHALES_FILE.exists(),
        "orders_count": len(load_json_file(ORDERS_FILE).get('orders', [])),
        "whales_count": len(load_json_file(WHALES_FILE).get('whales', []))
    })

@app.route('/api/status', methods=['GET'])
def get_status():
    """Get detailed status"""
    orders_data = load_json_file(ORDERS_FILE)
    whales_data = load_json_file(WHALES_FILE)
    
    return jsonify({
        "orders": {
            "count": len(orders_data.get('orders', [])),
            "lastUpdate": orders_data.get('lastUpdate', 0),
            "file_exists": ORDERS_FILE.exists()
        },
        "whales": {
            "count": len(whales_data.get('whales', [])),
            "lastUpdate": whales_data.get('lastUpdate', 0),
            "file_exists": WHALES_FILE.exists()
        },
        "server_time": int(datetime.now().timestamp() * 1000),
        "realData": True
    })

if __name__ == '__main__':
    print("🚀 Starting Artifice Local API Server")
    print("=====================================")
    print(f"📁 Cache directory: {CACHE_DIR}")
    print(f"📄 Orders file: {ORDERS_FILE}")
    print(f"📄 Whales file: {WHALES_FILE}")
    print("")
    print("🌐 API Endpoints:")
    print("  - GET /api/orders - Live orders data")
    print("  - GET /api/whales - Whale activity data")
    print("  - GET /api/health - Health check")
    print("  - GET /api/status - Detailed status")
    print("")
    print("🔗 Server will be available at: http://localhost:3001")
    print("")
    
    app.run(host='0.0.0.0', port=3001, debug=True)
