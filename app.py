from flask import Flask, request, jsonify, render_template
import sqlite3
import json

app = Flask(__name__)

DATABASE = 'webgis.db'

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS datasets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            filename TEXT NOT NULL,
            data TEXT NOT NULL,
            upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            user_id TEXT DEFAULT 'anonymous',
            geometry_types TEXT,
            feature_count INTEGER,
            bounds TEXT,
            description TEXT
        )''')
    
    conn.commit()
    conn.close()
    
def get_db_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/save-dataset', methods=['POST'])
def save_dataset():
    try:
        data = request.get_json()
        
        if not data or 'data' not in data:
            return jsonify({'error' : 'No data provided'}), 400
        
        dataset = data['data']
        filename = data.get('filename', 'untitled.geojson')
        name = data.get('name', filename.replace('geojson', ''))
        description = data.get('description', '')
        
        geometry_types = set()
        feature_count = 0
        
        if dataset.get('type') == 'FeatureCollection':
            features = dataset.get('features', [])
            feature_count = len(features)
            for feature in features:
                if feature.get('geometry') and feature['geometry'].get('type'):
                    geometry_types.add(feature['geometry']['type'])
        elif dataset.get('type') == 'Feature':
            feature_count = 1
            if dataset.get('geometry') and dataset['geometry'].get('type'):
                geometry_types.add(dataset['geometry']['type'])
                
        geometry_types_str = ','.join(sorted(geometry_types))
        
        bounds = None
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO datasets
            (name, filename, data, geometry_types, feature_count, bounds, description)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ''',
            (name, 
             filename, 
             json.dumps(dataset),
             geometry_types_str,
             feature_count,
             bounds,
             description)
        )
        
        dataset_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return jsonify({
            'success' : True,
            'id' : dataset_id,
            'message' : f'Dataset {name} saved successfully'
        }), 200
        
    except Exception as e:
        return jsonify({'error' : str(e)}), 500
    
@app.route('/api/get-datasets', methods=['GET'])
def get_datasets():
    try:
        conn = get_db_connection()
        
        rows = conn.execute('''
            SELECT id, name, filename, upload_date, geometry_types, feature_count, description
            FROM datasets
            ORDER BY upload_date DESC
        ''')
        
        datasets = []
        for row in rows:
            datasets.append({
                'id' : row['id'],
                'name' : row['name'],
                'filename' : row['filename'],
                'upload_date' : row['upload_date'],
                'geometry_types' : row['geometry_types'],
                'feature_count' : row['feature_count'],
                'description' : row['description']
            })

        conn.close()
        return jsonify(datasets), 200
    
    except Exception as e:
        return jsonify({'error' : str(e)}), 500

@app.route('/api/get-dataset/<int:dataset_id>', methods=['GET'])
def get_dataset(dataset_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT data FROM datasets WHERE id = ?
        ''', (dataset_id,))
        
        row = cursor.fetchone()

        if not row:
            return jsonify({'error' : 'Dataset not found'}), 404

        conn.close()
        return jsonify(json.loads(row['data']))
    except Exception as e:
        return jsonify({'error' : str(e)}), 500

@app.route('/api/remove-dataset/<int:dataset_id>', methods = ['GET', 'DELETE'])
def remove_dataset(dataset_id):
    try:
        conn = get_db_connection()
        conn.execute("DELETE FROM datasets WHERE id = ?", (dataset_id,))
        conn.commit()
        return jsonify({
            'success' : True,
            'id' : dataset_id,
            'message' : f'Dataset {dataset_id} removed successfully'
        }), 200
        
    except Exception as e:
        return({'error' : str(e)}), 500

if __name__ == '__main__':
    init_db()
    app.run(host="0.0.0.0", debug=True)
        