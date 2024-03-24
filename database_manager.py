## database_manager.py

import sqlite3
from typing import List, Any, Union

class DatabaseManager:
    def __init__(self, db_path):
        """
        DatabaseManagerをSQLiteデータベースのパスで初期化し、データベース接続を確立します。
        
        :param db_path: SQLiteデータベースファイルのパス。
        """
        self.db_path = db_path
        self.connection = None
        self.connect()
        self.create_prompts_table()  # インスタンス化時にpromptsテーブルを初期化

    def connect(self) -> None:
        """
        SQLiteデータベースへの接続を確立します。
        """
        try:
            self.connection = sqlite3.connect(self.db_path)
            print("Connection to SQLite DB successful")
        except sqlite3.Error as e:
            print(f"The error '{e}' occurred")
            raise e
        
    def create_prompts_table(self) -> None:
        """
        promptsテーブルが存在しない場合、新しく作成します。
        """
        query = """
        CREATE TABLE IF NOT EXISTS prompts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            prompt TEXT NOT NULL,
            description TEXT,
            tags TEXT,
            image_data BLOB
        )
        """
        self.execute_query(query)

    def execute_query(self, query: str, params: tuple = (), commit: bool = True):
        """
        SQLクエリを実行します。
        
        :param query: 実行するSQLクエリ。
        :param params: SQLクエリのパラメータ。
        :param commit: トランザクションをコミットするかどうか。
        :return: SELECTクエリの場合は結果のリスト、その他の場合は最後に挿入された行のIDを返します。
        """
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
            print(f"The error '{e}' occurred")
            raise e

    def fetch_all(self, query: str, params: tuple = ()) -> List[tuple]:
        """
        クエリ結果の全行を取得し、タプルのリストとして返します。
        
        :param query: データ取得用のSQLクエリ。
        :param params: SQLクエリのオプションパラメータ。
        :return: クエリ結果を含むタプルのリスト。
        """
        return self.execute_query(query, params)

    def fetch_one(self, query: str, params: tuple = ()) -> Union[tuple, None]:
        """
        クエリ結果の1行を取得し、タプルとして返します。
        行が見つからない場合は、Noneを返します。
        
        :param query: データ取得用のSQLクエリ。
        :param params: SQLクエリのオプションパラメータ。
        :return: クエリ結果を含むタプル。行が見つからない場合はNone。
        """
        result = self.execute_query(query, params)
        if result:
            return result[0]
        else:
            return None

    def close_connection(self) -> None:
        """
        データベース接続を明示的に閉じます。
        """
        if self.connection:
            self.connection.close()
            print("Database connection is closed")

    def __del__(self):
        """
        DatabaseManagerが破棄されるときに、データベース接続が閉じられるようにします。
        """
        self.close_connection()