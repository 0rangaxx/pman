## ui.py
from PyQt5.QtWidgets import QMainWindow, QWidget, QVBoxLayout, QHBoxLayout, QLabel, QApplication, QComboBox, QPushButton, QCheckBox, QLineEdit, QListWidget, QFileDialog, QMenu, QAction, QListWidgetItem, QScrollArea, QGridLayout
from PyQt5.QtCore import Qt, pyqtSignal, QSize
from PyQt5.QtGui import QPixmap, QKeySequence, QIcon
import sys
import os
import configparser
from typing import List, Tuple
from database import DatabaseManager
from image_processor import ImageProcessor
from PIL import Image 
from datetime import datetime
from overview_screen import OverviewScreen  # OverviewScreenをインポート

class UIManager(QWidget):
    thumbnail_display_requested = pyqtSignal()
    tag_list_update_requested = pyqtSignal()
    display_thumbnails_signal = pyqtSignal()  

    def __init__(self, parent=None):
        super().__init__(parent)
        self.db_manager = DatabaseManager()
        self.image_processor = ImageProcessor()
        self.directory_edit = QLineEdit()  # 追加: directory_editを初期化
        self.config_file = 'config.ini'
        self.config = configparser.ConfigParser()
        self.setWindowTitle("Image Viewer")
        self.tag_list = []
        self.searching_tags = []
        self.update_target_list = []
        self.iFiles = []

        self.create_central_widget()
        self.setup_connections()
        self.display_thumbnails_signal.connect(self.display_thumbnails)  # シグナルとスロットを接続

        self.thumbnail_widget = ThumbnailWidget(self.scroll_area, self)
        self.scroll_area.setWidget(self.thumbnail_widget)

        # 設定ファイルが存在する場合は読み込む
        if os.path.exists(self.config_file):
            self.config.read(self.config_file)

        # 設定ファイルに`opendirectory`の値が存在する場合は、その値を使用してディレクトリを開く
        if self.config.has_option('DEFAULT', 'opendirectory'):
            directory = self.config.get('DEFAULT', 'opendirectory')
        if os.path.exists(directory):
            # self.open_directory(directory)
            self.on_directory_button_clicked(directory)  # 追加: on_directory_button_clickedメソッドを呼び出す



    def setup_connections(self):
        pass

    def create_central_widget(self):
        central_widget = QWidget()
    # self.setCentralWidget(central_widget)  # この行を削除

        main_layout = QHBoxLayout()
        central_widget.setLayout(main_layout)

        left_space = self.create_left_space()
        right_space = self.create_right_space()

        main_layout.addWidget(left_space)
        main_layout.addWidget(right_space, stretch=6)

        self.setLayout(main_layout)  # central_widgetのレイアウトを直接UIManagerに設定

    def create_left_space(self):
        left_space = QWidget()
        left_layout = QVBoxLayout(left_space)

        sort_layout = QHBoxLayout()
        self.sort_combo = QComboBox()
        self.sort_combo.addItems(["更新日時", "レーティング", "ファイル名"])
        self.sort_order_button = QPushButton("△")
        sort_layout.addWidget(QLabel("ソート設定:"))
        sort_layout.addWidget(self.sort_combo)
        sort_layout.addWidget(self.sort_order_button)
        left_layout.addLayout(sort_layout)

        flag_layout = QHBoxLayout()
        self.nsfw_check = QCheckBox("NSFW")
        self.fav_check = QCheckBox("Fav")
        self.trash_check = QCheckBox("Trash")
        flag_layout.addWidget(self.nsfw_check)
        flag_layout.addWidget(self.fav_check)
        flag_layout.addWidget(self.trash_check)
        left_layout.addLayout(flag_layout)

        search_layout = QHBoxLayout()
        self.search_edit = QLineEdit()
        self.search_button = QPushButton("検索")
        self.clear_button = QPushButton("クリア")
        search_layout.addWidget(self.search_edit)
        search_layout.addWidget(self.search_button)
        search_layout.addWidget(self.clear_button)
        left_layout.addLayout(search_layout)

        self.search_tag_list = QListWidget()
        left_layout.addWidget(QLabel("現在検索中タグ:"))
        left_layout.addWidget(self.search_tag_list)

        self.current_tag_list = QListWidget()
        left_layout.addWidget(QLabel("現在表示中タグ:"))
        left_layout.addWidget(self.current_tag_list)
        
        show_overview_button = QPushButton("Tag Manager")  # OverviewScreenを表示するボタンを追加
        show_overview_button.clicked.connect(self.show_overview)  # ボタンのクリックイベントとスロットを接続
        left_layout.addWidget(show_overview_button)  # ボタンをレイアウトに追加

        return left_space

    def create_right_space(self):
        right_space = QWidget()
        right_layout = QVBoxLayout(right_space)

        directory_layout = QHBoxLayout()
        self.update_button = QPushButton("更新")
        self.directory_button = QPushButton("ディレクトリ選択")
        self.directory_edit.setReadOnly(True)
        directory_layout.addWidget(self.update_button)
        directory_layout.addWidget(self.directory_button)
        directory_layout.addWidget(self.directory_edit)
        right_layout.addLayout(directory_layout)

        self.scroll_area = QScrollArea()
        self.scroll_area.setWidgetResizable(True)
        self.thumbnail_grid = QWidget()
        # self.thumbnail_layout = QGridLayout()
        # self.thumbnail_grid.setLayout(self.thumbnail_layout)
        self.scroll_area.setWidget(self.thumbnail_grid)
        right_layout.addWidget(self.scroll_area)

        # サムネイルの右クリックコンテキストメニューを設定
        self.scroll_area.setContextMenuPolicy(Qt.CustomContextMenu)
        self.scroll_area.customContextMenuRequested.connect(self.show_context_menu)

        return right_space

    def show_context_menu(self, position):
        menu = QMenu(self)
        open_action = QAction("Open", self)
        open_action.triggered.connect(self.open_selected_images)
        open_action.setShortcut(QKeySequence(Qt.Key_Return))
        menu.addAction(open_action)

        fav_action = QAction("Fav", self)
        fav_action.triggered.connect(self.toggle_fav_selected_images)
        fav_action.setShortcut(QKeySequence(Qt.Key_F))
        menu.addAction(fav_action)

        nsfw_action = QAction("NSFW", self)
        nsfw_action.triggered.connect(self.toggle_nsfw_selected_images)
        nsfw_action.setShortcut(QKeySequence(Qt.Key_N))
        menu.addAction(nsfw_action)

        trash_action = QAction("Trash", self)
        trash_action.triggered.connect(self.trash_selected_images)
        trash_action.setShortcut(QKeySequence(Qt.Key_Delete))
        menu.addAction(trash_action)

        menu.exec_(self.thumbnail_display.mapToGlobal(position))

    def show_overview(self):
        self.overview = OverviewScreen(self)  # OverviewScreenインスタンスを作成
        self.overview.show()  # OverviewScreenを表示

    def display_thumbnails_slot(self):
        self.display_thumbnails()

    def open_selected_images(self):
        # 選択された画像を開く処理を実装
        pass

    def toggle_fav_selected_images(self):
        # 選択された画像のお気に入りを切り替える処理を実装
        pass

    def toggle_nsfw_selected_images(self):
        # 選択された画像のNSFWを切り替える処理を実装
        pass

    def trash_selected_images(self):
        # 選択された画像をゴミ箱に移動する処理を実装
        pass

    def on_directory_button_clicked(self, directory=None):
        if directory is None:
            # ユーザデータからディレクトリを選択する
            selected_directory = QFileDialog.getExistingDirectory(self, "Select Directory")
        else:
            selected_directory = directory

        if selected_directory:
            if hasattr(self, 'directory_edit'):  # 追加: directory_editの存在チェック
                self.directory_edit.setText(selected_directory)
            print(f"選択されたディレクトリ: {selected_directory}")

            # 選択されたディレクトリを設定ファイルに保存
            self.config.set('DEFAULT', 'opendirectory', selected_directory)
            with open(self.config_file, 'w') as file:
                self.config.write(file)

            # 変数の初期化
            self.tag_list = []
            self.searching_tags = []
            self.update_target_list = []
            self.iFiles = []

            # 関数「open_directory」呼び出し
            self.iFiles = self.open_directory(selected_directory)
            print(f"iFilesの長さ: {len(self.iFiles)}")

            # 変数「iFiles」でループ処理を開始する
            for file_path, updated_at in self.iFiles:
                file_name = os.path.basename(file_path)
                if self.fetch_file(file_name, selected_directory, updated_at):
                    self.update_target_list.append(file_name)
            print(f"更新対象リストの長さ: {len(self.update_target_list)}")

            # 「update_target_list」でループ処理を開始する
            for file_name in self.update_target_list:
                self.record_file_process(file_name, selected_directory)

            # 関数「display_thumbnails」呼出
            self.display_thumbnails()

    def open_directory(self, directory_path: str) -> List[Tuple[str, float]]:
        image_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp']
        image_files = []
        for root, dirs, files in os.walk(directory_path):
            for file in files:
                _, extension = os.path.splitext(file)
                if extension.lower() in image_extensions:
                    file_path = os.path.join(root, file)
                    updated_at = os.path.getmtime(file_path)
                    image_files.append((file_path, updated_at))
        print(f"ディレクトリ内の画像ファイル数: {len(image_files)}")
        return image_files

    def fetch_file(self, file_name: str, directory_path: str, file_updated_at: float) -> bool:
        attributes = self.db_manager.retrieve_image_attributes_by_file_name(file_name, directory_path)
        if attributes is None:
            print(f"新しいファイルが見つかりました: {file_name}")
            return True
        else:
            db_updated_at = datetime.fromisoformat(attributes['updated_at'])
            file_updated_at = datetime.fromtimestamp(file_updated_at)
            if db_updated_at < file_updated_at:
                print(f"ファイルが更新されています: {file_name}")
                print(f"データベースの更新日時: {db_updated_at}")
                print(f"ファイルの更新日時: {file_updated_at}")
                return True
            else:
                print(f"ファイルは最新の状態です: {file_name}") 
                return False

    def record_file_process(self, file_name: str, directory_path: str):
        file_path = os.path.join(directory_path, file_name)
        # 元画像の解像度を取得
        with Image.open(file_path) as img:
            original_size = img.size
        
        # 元画像の解像度の50%でサムネイルを生成
        thumbnail_size = (original_size[0] // 2, original_size[1] // 2)
        thumbnail_data = self.image_processor.generate_thumbnail(file_path, size=thumbnail_size)
        
        _, extension = os.path.splitext(file_name)
        self.db_manager.insert_image_attributes({
            'directory_path': directory_path,
            'file_name': file_name,
            'extension': extension,
            'thumbnail': thumbnail_data
        })
        print(f"ファイルをデータベースに記録: {file_name}")

    def display_thumbnails(self):
        self.thumbnail_widget.clear_thumbnails()  # サムネイル画像のみをクリアする

        # Calculate the number of columns based on the scroll area width and thumbnail size
        scroll_area_width = self.scroll_area.viewport().width()
        thumbnail_width = self.thumbnail_widget.thumbnail_size.width()
        num_columns = max(1, scroll_area_width // thumbnail_width)

        row, col = 0, 0
        for file_path, _ in self.iFiles:
            file_name = os.path.basename(file_path)
            directory_path = os.path.dirname(file_path)
            attributes = self.db_manager.retrieve_image_attributes_by_file_name(file_name, directory_path)
            if attributes:
                thumbnail_data = attributes['thumbnail']
                pixmap = QPixmap()
                pixmap.loadFromData(thumbnail_data, "JPEG")

                # Adjust thumbnail size based on the current thumbnail_size
                scaled_pixmap = pixmap.scaled(self.thumbnail_widget.thumbnail_size, Qt.KeepAspectRatio, Qt.SmoothTransformation)
                label = QLabel()
                label.setPixmap(scaled_pixmap)
                self.thumbnail_widget.layout().addWidget(label, row, col)
                col += 1
                if col >= num_columns:
                    col = 0
                    row += 1
                print(f"サムネイルを表示: {file_name}")

class ThumbnailWidget(QWidget):
    def __init__(self, parent=None, ui_manager=None):
        super().__init__(parent)
        self.ui_manager = ui_manager
        self.setLayout(QGridLayout())
        self.layout().setHorizontalSpacing(1)  # 横幅スペーシングを5に設定
        self.layout().setVerticalSpacing(1)    # 縦幅スペーシングを5に設定
        self.thumbnail_size = QSize(300, 300)

    def clear_thumbnails(self):
        while self.layout().count():
            item = self.layout().takeAt(0)
            widget = item.widget()
            if widget:
                widget.deleteLater()

    def wheelEvent(self, event):
        if event.modifiers() & Qt.ControlModifier:
            self.clear_thumbnails()
            delta = event.angleDelta().y()
            if delta > 0:
                self.thumbnail_size *= 1.1
            else:
                self.thumbnail_size /= 1.1
            self.thumbnail_size = self.thumbnail_size.expandedTo(QSize(64, 64))
            self.thumbnail_size = self.thumbnail_size.boundedTo(QSize(1024, 1024))
            self.ui_manager.display_thumbnails()
            event.accept()
        else:
            super().wheelEvent(event)


if __name__ == "__main__":
    app = QApplication(sys.argv)
    ui_manager = UIManager()
    ui_manager.show()
    sys.exit(app.exec_())