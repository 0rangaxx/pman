## ui.py
from PyQt5.QtWidgets import QMainWindow, QWidget, QVBoxLayout, QHBoxLayout, QLabel, QApplication, QComboBox, QPushButton, QCheckBox, QLineEdit, QListWidget, QFileDialog, QMenu, QAction, QListWidgetItem, QScrollArea, QGridLayout
from PyQt5.QtCore import Qt, pyqtSignal, QSize
from PyQt5.QtGui import QPixmap, QKeySequence, QIcon
import sys
import os
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
        self.setWindowTitle("Image Viewer")
        self.db_manager = DatabaseManager()
        self.image_processor = ImageProcessor()
        self.tag_list = []
        self.searching_tags = []
        self.update_target_list = []
        self.iFiles = []

        self.create_central_widget()
        self.setup_connections()
        self.display_thumbnails_signal.connect(self.display_thumbnails)  # シグナルとスロットを接続

        self.thumbnail_widget = ThumbnailWidget(self.scroll_area, self)
        self.scroll_area.setWidget(self.thumbnail_widget)


    def setup_connections(self):
        self.directory_button.clicked.connect(self.on_directory_button_clicked)

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
        self.directory_edit = QLineEdit()
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

    def on_directory_button_clicked(self):
        # ユーザデータからディレクトリを選択する
        selected_directory = QFileDialog.getExistingDirectory(self, "Select Directory")
        if selected_directory:
            self.directory_edit.setText(selected_directory)
            print(f"選択されたディレクトリ: {selected_directory}")

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
            print(f"更新が必要なファイル: {file_name}")
            return True
        else:
            db_updated_at = datetime.fromisoformat(attributes['updated_at'])
            file_updated_at = datetime.fromtimestamp(file_updated_at)
            if db_updated_at < file_updated_at:
                print(f"更新が必要なファイル: {file_name}")
                return True
            else:
                print(f"更新が不要なファイル: {file_name}")
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


    def resizeEvent(self, event):
        super().resizeEvent(event)
        self.display_thumbnails()

    def display_thumbnails(self):
        # Clear existing thumbnails
        while self.thumbnail_widget.layout().count():
            child = self.thumbnail_widget.layout().takeAt(0)
            if child.widget():
                child.widget().deleteLater()

        # Calculate the number of columns based on the scroll area width and thumbnail size
        scroll_area_width = self.scroll_area.viewport().width()
        thumbnail_width = self.thumbnail_widget.thumbnail_size.width()
        num_columns = max(1, scroll_area_width // thumbnail_width)

        # Calculate the visible range of thumbnails
        scroll_bar = self.scroll_area.verticalScrollBar()
        start_index = scroll_bar.value() // self.thumbnail_widget.thumbnail_size.height() * num_columns
        end_index = start_index + (self.scroll_area.viewport().height() // self.thumbnail_widget.thumbnail_size.height() + 1) * num_columns

        row, col = 0, 0
        for index in range(start_index, min(end_index, len(self.iFiles))):
            file_path, _ = self.iFiles[index]
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
        self.thumbnail_size = QSize(256, 256)

    def wheelEvent(self, event):
        if event.modifiers() & Qt.ControlModifier:
            delta = event.angleDelta().y()
            if delta > 0:
                self.thumbnail_size *= 1.1
            else:
                self.thumbnail_size /= 1.1
            self.thumbnail_size = self.thumbnail_size.expandedTo(QSize(64, 64))
            self.thumbnail_size = self.thumbnail_size.boundedTo(QSize(1024, 1024))
            # self.parent().parent().display_thumbnails_signal.emit()  # シグナルを発行
            self.ui_manager.display_thumbnails_slot()
            event.accept()
        else:
            super().wheelEvent(event)


if __name__ == "__main__":
    app = QApplication(sys.argv)
    ui_manager = UIManager()
    ui_manager.show()
    sys.exit(app.exec_())