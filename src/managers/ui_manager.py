# ui.py
from PyQt5.QtWidgets import QWidget, QHBoxLayout, QLineEdit, QFileDialog
from PyQt5.QtCore import pyqtSignal
from PyQt5.QtGui import QPixmap
from PIL import Image
from datetime import datetime
import re, json, os, configparser
from typing import List, Tuple
from managers.database_manager import DatabaseManager
from managers.config_manager import ConfigManager
from interface.context_menu import ContextMenu
from interface.right_panel import RightPanel
from interface.left_panel import LeftPanel
from overview_screen import OverviewScreen
from image_processor import ImageProcessor
from tag_manager import TagManager

class UIManager(QWidget):
    thumbnail_display_requested = pyqtSignal()
    tag_list_update_requested = pyqtSignal()
    directory_selected = pyqtSignal(str)  # ディレクトリ選択シグナルを追加

    def __init__(self, parent=None):
        super().__init__(parent)
        self.db_manager = DatabaseManager()
        self.image_processor = ImageProcessor()
        self.tag_manager = TagManager()
        self.directory_edit = QLineEdit()
        self.config_manager = ConfigManager()
        self.delimiter = self.config_manager.get_delimiter()
        self.directory = self.config_manager.get_directory()
        self.iFiles = []

        self.right_panel = RightPanel(self)  # selfを親ウィジェットとして渡す
        self.right_panel.directory_selected.connect(self.on_directory_button_clicked)  # シグナルに接続
        self.create_main_layout()
        self.setup_connections()

        if self.directory and os.path.exists(self.directory):
            self.on_directory_button_clicked(self.directory)

    def create_main_layout(self):
        """
        メインレイアウトを作成する
        """
        main_layout = QHBoxLayout(self)
        self.setLayout(main_layout)
        self.left_panel = LeftPanel(delimiter=self.delimiter)  # delimiterを引数で渡す
        main_layout.addWidget(self.left_panel)
        main_layout.addWidget(self.right_panel, stretch=6)

    def setup_connections(self):
        """
        シグナルとスロットの接続を設定する
        """
        self.left_panel.search_tags_updated.connect(self.update_search_tags)
        self.left_panel.search_tags_updated.connect(self.display_thumbnails)

    def show_context_menu(self, position):
        context_menu = ContextMenu(self)
        context_menu.exec_(self.scroll_area.mapToGlobal(position))

    def show_overview(self):
        self.overview = OverviewScreen(self)
        self.overview.show()

    def on_directory_button_clicked(self, directory):
        """
        ディレクトリ選択ボタンがクリックされたときの処理
        """
        if directory is None:
            selected_directory = QFileDialog.getExistingDirectory(self, "Select Directory")
        else:
            selected_directory = directory

        if selected_directory:
            # self.directory_selected.emit(selected_directory)  # ディレクトリ選択シグナルを発信
            if hasattr(self, 'directory_edit'):
                self.right_panel.set_directory_text(selected_directory)
            print(f"選択されたディレクトリ: {selected_directory}")  # 選択されたディレクトリをprintする

            self.config_manager.set_directory(selected_directory)

            self.tag_list = []
            self.searching_tags = []
            self.update_target_list = []
            self.iFiles = []

            self.iFiles = self.open_directory(selected_directory)
            print(f"iFilesの長さ: {len(self.iFiles)}")  # iFilesの長さをprintする

            for file_path, updated_at in self.iFiles:
                file_name = os.path.basename(file_path)
                if self.fetch_file(file_name, selected_directory, updated_at):
                    self.update_target_list.append(file_name)
            print(f"更新対象リストの長さ: {len(self.update_target_list)}")  # 更新対象リストの長さをprintする

            for file_name in self.update_target_list:
                self.record_file_process(file_name, selected_directory)

            self.display_thumbnails()

    def open_directory(self, directory_path: str) -> List[Tuple[str, float]]:
        """
        指定されたディレクトリ内の画像ファイルのパスと更新日時のリストを返す
        """
        image_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp']
        image_files = []
        for root, dirs, files in os.walk(directory_path):
            for file in files:
                _, extension = os.path.splitext(file)
                if extension.lower() in image_extensions:
                    file_path = os.path.join(root, file)
                    updated_at = os.path.getmtime(file_path)
                    image_files.append((file_path, updated_at))
        print(f"ディレクトリ内の画像ファイル数: {len(image_files)}")  # ディレクトリ内の画像ファイル数をprintする
        return image_files

    def fetch_file(self, file_name: str, directory_path: str, file_updated_at: float) -> bool:
        """
        指定されたファイルが新規または更新されているかを確認する
        """
        attributes = self.db_manager.retrieve_image_attributes_by_file_name(file_name, directory_path)
        if attributes is None:
            print(f"新しいファイルが見つかりました: {file_name}")  # 新しいファイルが見つかったことをprintする
            return True
        else:
            db_updated_at = datetime.fromisoformat(attributes['updated_at'])
            file_updated_at = datetime.fromtimestamp(file_updated_at)
            if db_updated_at < file_updated_at:
                print(f"ファイルが更新されています: {file_name}")  # ファイルが更新されたことをprintする
                print(f"データベースの更新日時: {db_updated_at}")  # データベースの更新日時をprintする
                print(f"ファイルの更新日時: {file_updated_at}")  # ファイルの更新日時をprintする
                return True
            else:
                return False

    def extract_metadata(self, image_path):
        """
        画像ファイルからメタデータを抽出する
        """
        if not os.path.isfile(image_path):
            print(f"Error: File not found - {image_path}")  # ファイルが見つからなかったことをprintする
            return None

        _, ext = os.path.splitext(image_path)
        if ext.lower() not in ['.png', '.jpg', '.jpeg']:
            print(f"Error: Unsupported file format - {ext}")  # サポートされていないファイル形式であることをprintする
            return None

        metaChunk = None

        with open(image_path, "rb") as bin:
            if ext.lower() == '.png':
                bin.seek(8)
                while True:
                    data_len_b = bin.read(4)
                    if not data_len_b:
                        break
                    data_len = int.from_bytes(data_len_b, "big")
                    chunk_type_b = bin.read(4)
                    chunk_type = chunk_type_b.decode()

                    if chunk_type == "tEXt":
                        data_b = bin.read(data_len)
                        data = data_b.decode()
                        keyword, text = data.split("\0", 1)
                        if keyword == "Software" and text == "NovelAI":
                            metaChunk = "NovelAI"
                        elif keyword == "Comment" and metaChunk == "NovelAI":
                            metaChunk = text
                            break
                    else:
                        bin.seek(data_len, 1)

                    bin.seek(4, 1)
            else:
                pass
        if metaChunk is None:
            print(f"No metadata found")  # メタデータが見つからなかったことをprintする
            return None
        image_attribute = self.extract_naidata(metaChunk)
        return image_attribute

    def extract_naidata(self, metadata_text):
        """
        NovelAIのメタデータから必要な情報を抽出する
        """
        try:
            softwear = 'NovelAI'
            metadata = json.loads(metadata_text)

            prompt = metadata.get("prompt", "")
            negative_prompt = metadata.get("uc", "")

            description = f"steps: {metadata.get('steps', '')}, height: {metadata.get('height', '')}, width: {metadata.get('width', '')}, scale: {metadata.get('scale', '')}, seed: {metadata.get('seed', '')}, sampler: {metadata.get('sampler', '')}"

            return softwear, prompt, negative_prompt, description

        except json.JSONDecodeError:
            print("Error: Invalid JSON format")  # 無効なJSONフォーマットであることをprintする
            return "", "", "", ""

    def record_file_process(self, file_name: str, directory_path: str):
        """
        指定されたファイルの情報をデータベースに記録する
        """
        file_path = os.path.join(directory_path, file_name)
        metadata = self.extract_metadata(file_path)

        if metadata is not None:
            print('metadata ok')  # メタデータが取得できたことをprintする
            softwear, prompt, negative_prompt, description = metadata
        else:
            print('metadata none')  # メタデータが取得できなかったことをprintする
            softwear, prompt, negative_prompt, description = "", "", "", ""

        with Image.open(file_path) as img:
            original_size = img.size

        thumbnail_size = (original_size[0] // 2, original_size[1] // 2)
        thumbnail_data = self.image_processor.generate_thumbnail(file_path, size=thumbnail_size)

        _, extension = os.path.splitext(file_name)
        self.db_manager.insert_image_attributes({
            'directory_path': directory_path,
            'file_name': file_name,
            'extension': extension,
            'thumbnail': thumbnail_data,
            'softwear': softwear,
            'prompt': prompt,
            'negative_prompt': negative_prompt,
            'description': description
        })
        print(f"ファイルをデータベースに記録: {file_name}")  # ファイルをデータベースに記録したことをprintする

    def display_thumbnails(self, search_tags=None):
        """
        サムネイル画像を表示する
        """
        self.right_panel.clear_thumbnails()
        print(f"サムネイルを表示")  # サムネイルを表示することをprintする
        scroll_area_width = self.right_panel.scroll_area.viewport().width()
        thumbnail_width = self.right_panel.thumbnail_widget.thumbnail_size.width()
        num_columns = max(1, scroll_area_width // thumbnail_width)

        displayTags = []
        row, col = 0, 0
        attributes_list = [self.db_manager.retrieve_image_attributes_by_file_name(os.path.basename(file_path), os.path.dirname(file_path), search_tags) for file_path, _ in self.iFiles]
        for attributes in attributes_list:
            if attributes:
                thumbnail_data = attributes['thumbnail']
                self.right_panel.add_thumbnail(thumbnail_data, row, col)
                col += 1
                if col >= num_columns:
                    col = 0
                    row += 1

                prompt = attributes['prompt']
                prompt = re.sub(r'[\{\}\[\]]', '', prompt)
                if isinstance(prompt, str):  # promptが文字列であることを確認
                    displayTags.append(prompt)

        self.left_panel.update_current_tags(displayTags)

    def update_search_tags(self, search_tags):
        print(f"検索タグが更新されました: {search_tags}")  # 検索タグが更新されたことをprintする
