# database_manager.py

import sqlite3, os
from typing import Dict, Optional, List, Union
from datetime import datetime

class DatabaseManager:
    def __init__(self, db_path: str = 'images_and_prompts.db'):
        self.db_path = db_path
        self.connection = None
        self.connect()
        # データベースファイルが存在しない場合のみテーブルを作成
        if not os.path.exists(self.db_path):
            self._create_tables()

    def _connect(self):
        """コンテキストマネージャーを使用してデータベース接続を作成し、リトライロジックを適用します。"""
        for _ in range(3):
            try:
                return sqlite3.connect(self.db_path)
            except sqlite3.Error as e:
                print(f"データベース接続に失敗しました: {e}、リトライしています...")
        raise sqlite3.Error("複数回の試行後もデータベースに接続できませんでした。")

    def connect(self) -> None:
        """SQLiteデータベースへの接続を確立します。"""
        try:
            self.connection = self._connect()
            print("データベースへの接続が正常に確立されました。")
        except sqlite3.Error as e:
            print(f"データベースへの接続中にエラーが発生しました: {e}")
            raise e

    def _create_tables(self) -> None:
        """存在しない場合は、必要なテーブルを作成します。"""
        try:
            with self.connection:
                cursor = self.connection.cursor()
                
                # image_attributesテーブルの作成
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS image_attributes (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        directory_path TEXT NOT NULL,
                        file_name TEXT NOT NULL,
                        extension TEXT NOT NULL,
                        nsfw_flag INTEGER DEFAULT 0,
                        fav_flag INTEGER DEFAULT 0,
                        trash_flag INTEGER DEFAULT 0,
                        rating INTEGER DEFAULT 0,
                        software TEXT,
                        prompt TEXT,
                        negative_prompt TEXT,
                        description TEXT,
                        thumbnail BLOB,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                ''')
                
                # promptsテーブルの作成
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS prompts (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        title TEXT NOT NULL,
                        prompt TEXT NOT NULL,
                        description TEXT,
                        tags TEXT,
                        image_data BLOB
                    )
                ''')
                
                print("テーブルが正常に作成されました。")
        except sqlite3.Error as e:
            print(f"テーブルの作成中にエラーが発生しました: {e}")
            raise e

    def execute_query(self, query: str, params: tuple = (), commit: bool = True):
        """SQLクエリを実行します。"""
        try:
            with self.connection:
                cursor = self.connection.cursor()
                cursor.execute(query, params)
                if commit:
                    self.connection.commit()
                if query.strip().upper().startswith("SELECT"):
                    return cursor.fetchall()
                else:
                    return cursor.lastrowid
        except sqlite3.Error as e:
            print(f"クエリの実行中にエラーが発生しました: {e}")
            raise e

        
    def insert_image_attributes(self, image_attributes: Dict[str, str]) -> Optional[int]:
        try:
            with self._connect() as conn:
                cursor = conn.cursor()
                #print(f"画像の属性を挿入しています: {image_attributes}")

                nsfw_flag = image_attributes.get('nsfw_flag', 0)
                fav_flag = image_attributes.get('fav_flag', 0)
                trash_flag = image_attributes.get('trash_flag', 0)
                rating = image_attributes.get('rating', 0)
                software = image_attributes.get('software', '')
                prompt = image_attributes.get('prompt', '')
                negative_prompt = image_attributes.get('negative_prompt', '')
                description = image_attributes.get('description', '')

                cursor.execute('''
                    INSERT OR REPLACE INTO image_attributes (
                        directory_path, file_name, extension, nsfw_flag, fav_flag, trash_flag,
                        rating, software, prompt, negative_prompt, description, thumbnail, updated_at
                    )
                    VALUES (
                        :directory_path, :file_name, :extension, :nsfw_flag, :fav_flag, :trash_flag,
                        :rating, :software, :prompt, :negative_prompt, :description, :thumbnail, :updated_at
                    )
                ''', {**image_attributes, 'nsfw_flag': nsfw_flag, 'fav_flag': fav_flag, 'trash_flag': trash_flag, 'rating': rating, 'software': software, 'prompt': prompt, 'negative_prompt': negative_prompt, 'description': description, 'updated_at': datetime.now()})
                lastrowid = cursor.lastrowid
        except sqlite3.Error as e:
            print(f"画像の属性の挿入中にエラーが発生しました: {e}")
            return None
        
    def update_image_attributes(self, image_id: int, image_attributes: Dict[str, str]) -> bool:
        """コンテキストマネージャーを使用して、データベース内の画像の属性を更新します。"""
        try:
            with self._connect() as conn:
                cursor = conn.cursor()
                # print(f"ID: {image_id}の画像の属性を更新しています, 属性: {image_attributes}")

                nsfw_flag = image_attributes.get('nsfw_flag', 0)
                fav_flag = image_attributes.get('fav_flag', 0)
                trash_flag = image_attributes.get('trash_flag', 0)
                rating = image_attributes.get('rating', 0)
                software = image_attributes.get('software', '')
                prompt = image_attributes.get('prompt', '')
                negative_prompt = image_attributes.get('negative_prompt', '')
                description = image_attributes.get('description', '')

                cursor.execute('''
                    UPDATE image_attributes
                    SET directory_path = :directory_path, file_name = :file_name, extension = :extension,
                        nsfw_flag = :nsfw_flag, fav_flag = :fav_flag, trash_flag = :trash_flag,
                        rating = :rating, software = :software, prompt = :prompt,
                        negative_prompt = :negative_prompt, description = :description,
                        updated_at = :updated_at
                    WHERE id = :id
                ''', {**image_attributes, 'id': image_id, 'updated_at': datetime.now(), 'nsfw_flag': nsfw_flag, 'fav_flag': fav_flag, 'trash_flag': trash_flag, 'rating': rating, 'software': software, 'prompt': prompt, 'negative_prompt': negative_prompt, 'description': description})
                print(f"ID: {image_id}の画像の属性が更新されました")
                return True
        except sqlite3.Error as e:
            print(f"画像の属性の更新中にエラーが発生しました: {e}")
            return False

    def delete_image(self, image_id: int) -> bool:
        """コンテキストマネージャーを使用して、データベースから画像を削除します。"""
        try:
            with self._connect() as conn:
                cursor = conn.cursor()
                print(f"ID: {image_id}の画像を削除しています")
                cursor.execute('''
                    DELETE FROM image_attributes
                    WHERE id = ?
                ''', (image_id,))
                print(f"ID: {image_id}の画像が削除されました")
                return True
        except sqlite3.Error as e:
            print(f"画像の削除中にエラーが発生しました: {e}")
            return False
        
    def retrieve_image_attributes(self, image_id: int) -> Optional[Dict[str, str]]:
        """特定の画像の属性を取得します。"""
        try:
            with self._connect() as conn:
                cursor = conn.cursor()
                print(f"ID: {image_id}の画像の属性を取得しています")
                cursor.execute('''
                    SELECT *
                    FROM image_attributes
                    WHERE id = ?
                ''', (image_id,))
                result = cursor.fetchone()
                if result:
                    attributes = {
                        "id": result[0],
                        "directory_path": result[1],
                        "file_name": result[2],
                        "extension": result[3],
                        "nsfw_flag": result[4],
                        "fav_flag": result[5],
                        "trash_flag": result[6],
                        "rating": result[7],
                        "software": result[8],
                        "prompt": result[9],
                        "negative_prompt": result[10],
                        "description": result[11],
                        "thumbnail": result[12],
                        "updated_at": result[13],
                        "created_at": result[14]
                    }
                    # print(f"取得した画像の属性: {attributes}")
                    return attributes
                print(f"ID: {image_id}の画像が見つかりませんでした")
                return None
        except sqlite3.Error as e:
            print(f"画像の属性の取得中にエラーが発生しました: {e}")
            return None

    def retrieve_image_attributes_by_file_name(self, file_name: str, directory_path: str) -> Optional[Dict[str, str]]:
        """ファイル名とディレクトリパスに基づいて画像の属性を取得します。"""
        try:
            with self._connect() as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    SELECT *
                    FROM image_attributes
                    WHERE file_name = ? AND directory_path = ?
                ''', (file_name, directory_path))
                result = cursor.fetchone()
                if result:
                    attributes = {
                        "id": result[0],
                        "directory_path": result[1],
                        "file_name": result[2],
                        "extension": result[3],
                        "nsfw_flag": result[4],
                        "fav_flag": result[5],
                        "trash_flag": result[6],
                        "rating": result[7],
                        "software": result[8],
                        "prompt": result[9],
                        "negative_prompt": result[10],
                        "description": result[11],
                        "thumbnail": result[12],
                        "updated_at": result[13],
                        "created_at": result[14]
                    }
                    # print(f"取得した画像の属性: {attributes}")
                    return attributes
                print(f"ファイル名: {file_name} の画像が見つかりませんでした")
                return None
        except sqlite3.Error as e:
            print(f"画像の属性の取得中にエラーが発生しました: {e}")
            return None

    def list_images(self, tag: Optional[str] = None) -> List[Dict[str, str]]:
        """すべての画像またはタグでフィルタリングされた画像を一覧表示します。"""
        images = []
        try:
            with self._connect() as conn:
                cursor = conn.cursor()
                if tag:
                    print(f"タグ: {tag}の画像を一覧表示しています")
                    cursor.execute('''
                        SELECT *
                        FROM image_attributes
                        WHERE prompt LIKE ? OR negative_prompt LIKE ?
                    ''', ('%' + tag + '%', '%' + tag + '%'))
                else:
                    print("すべての画像を一覧表示しています")
                    cursor.execute('''
                        SELECT *
                        FROM image_attributes
                    ''')
                for row in cursor.fetchall():
                    images.append({
                        "id": row[0],
                        "directory_path": row[1],
                        "file_name": row[2],
                        "extension": row[3],
                        "nsfw_flag": row[4],
                        "fav_flag": row[5],
                        "trash_flag": row[6],
                        "rating": row[7],
                        "software": row[8],
                        "prompt": row[9],
                        "negative_prompt": row[10],
                        "description": row[11],
                        "thumbnail": row[12],
                        "updated_at": row[13],
                        "created_at": row[14]
                    })
                print(f"{len(images)}枚の画像が一覧表示されました")
        except sqlite3.Error as e:
            print(f"画像の一覧表示中にエラーが発生しました: {e}")
        return images
    
    def insert_prompt(self, title: str, prompt: str, description: str = "", tags: str = "", image_data: bytes = None) -> Optional[int]:
        """promptsテーブルに新しいプロンプトを挿入します。"""
        try:
            with self._connect() as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    INSERT INTO prompts (title, prompt, description, tags, image_data)
                    VALUES (?, ?, ?, ?, ?)
                ''', (title, prompt, description, tags, image_data))
                return cursor.lastrowid
        except sqlite3.Error as e:
            print(f"プロンプトの挿入中にエラーが発生しました: {e}")
            return None

    def update_prompt(self, prompt_id: int, title: str = None, prompt: str = None, description: str = None, tags: str = None, image_data: bytes = None) -> bool:
        """promptsテーブルの既存のプロンプトを更新します。"""
        try:
            with self._connect() as conn:
                cursor = conn.cursor()
                update_fields = []
                params = []

                if title is not None:
                    update_fields.append("title = ?")
                    params.append(title)
                if prompt is not None:
                    update_fields.append("prompt = ?")
                    params.append(prompt)
                if description is not None:
                    update_fields.append("description = ?")
                    params.append(description)
                if tags is not None:
                    update_fields.append("tags = ?")
                    params.append(tags)
                if image_data is not None:
                    update_fields.append("image_data = ?")
                    params.append(image_data)

                if update_fields:
                    query = f"UPDATE prompts SET {', '.join(update_fields)} WHERE id = ?"
                    params.append(prompt_id)
                    cursor.execute(query, tuple(params))
                    return True
                else:
                    print("更新するフィールドが指定されていません")
                    return False
        except sqlite3.Error as e:
            print(f"プロンプトの更新中にエラーが発生しました: {e}")
            return False

    def delete_prompt(self, prompt_id: int) -> bool:
        """promptsテーブルから指定されたプロンプトを削除します。"""
        try:
            with self._connect() as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    DELETE FROM prompts
                    WHERE id = ?
                ''', (prompt_id,))
                return True
        except sqlite3.Error as e:
            print(f"プロンプトの削除中にエラーが発生しました: {e}")
            return False

    def fetch_all_prompts(self) -> List[tuple]:
        """promptsテーブルからすべてのプロンプトを取得します。"""
        return self.execute_query("SELECT * FROM prompts")

    def fetch_prompt(self, prompt_id: int) -> Union[tuple, None]:
        """promptsテーブルから指定されたIDのプロンプトを取得します。"""
        result = self.execute_query("SELECT * FROM prompts WHERE id = ?", (prompt_id,))
        if result:
            return result[0]
        else:
            return None



    def close_connection(self) -> None:
        """データベース接続を明示的に閉じます。"""
        if self.connection:
            self.connection.close()
            print("データベース接続が閉じられました。")

    def __del__(self):
        """DatabaseManagerが破棄されるときに、データベース接続が閉じられるようにします。"""
        self.close_connection()