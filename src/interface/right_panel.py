from PyQt5.QtWidgets import QWidget, QVBoxLayout, QHBoxLayout, QPushButton, QLineEdit, QScrollArea, QFileDialog
from interface.thumbnail_widget import ThumbnailWidget
from PyQt5.QtCore import pyqtSignal

class RightPanel(QWidget):
    # ディレクトリ選択時に発信されるシグナル
    directory_selected = pyqtSignal(str)  

    def __init__(self, parent=None):
        super().__init__(parent)
        self.directory_button = QPushButton("ディレクトリ選択")
        self.init_ui()
        self.directory_button.clicked.connect(self.open_directory_dialog)  # ディレクトリ選択ボタンがクリックされたときの処理を設定
        self.thumbnail_widget.thumbnail_clicked.connect(self.highlight_thumbnail)  # シグナルとスロットを接続


    def init_ui(self):
        # 全体のレイアウトを定義
        layout = QVBoxLayout()

        # ディレクトリ選択関連のレイアウトを定義
        directory_layout = QHBoxLayout()
        self.update_button = QPushButton("更新")
        self.directory_button = QPushButton("ディレクトリ選択")
        self.directory_edit = QLineEdit()
        self.directory_edit.setReadOnly(True)  # ディレクトリ入力欄は読み取り専用
        directory_layout.addWidget(self.update_button)
        directory_layout.addWidget(self.directory_button)
        directory_layout.addWidget(self.directory_edit)
        layout.addLayout(directory_layout)

        # サムネイル表示領域を定義
        self.scroll_area = QScrollArea()
        self.scroll_area.setWidgetResizable(True)
        self.thumbnail_widget = ThumbnailWidget(self.scroll_area)
        self.scroll_area.setWidget(self.thumbnail_widget)
        layout.addWidget(self.scroll_area)

        self.setLayout(layout)
        
    def highlight_thumbnail(self, row, col):
        for i in range(self.thumbnail_widget.grid_layout.rowCount()):
            for j in range(self.thumbnail_widget.grid_layout.columnCount()):
                item = self.thumbnail_widget.grid_layout.itemAtPosition(i, j)
                if item:
                    label = item.widget()
                    if i == row and j == col:
                        label.setStyleSheet("border: 2px solid red;")  # ハイライトを設定
                    else:
                        label.setStyleSheet("border: none;")  # ハイライトを解除

    def open_directory_dialog(self):
        print("ディレクトリ選択ダイアログを開きます")
        directory = QFileDialog.getExistingDirectory(self, "ディレクトリを選択してください")
        if directory:
            print(f"選択されたディレクトリ: {directory}")
            self.directory_selected.emit(directory)  # ディレクトリ選択シグナルを発信

    def set_directory_text(self, text):
        print(f"ディレクトリ入力欄に '{text}' を設定します")
        self.directory_edit.setText(text)

    def clear_thumbnails(self):
        print("サムネイルをクリアします")
        self.thumbnail_widget.clear_thumbnails()

    def add_thumbnail(self, pixmap, row, col):
        self.thumbnail_widget.add_thumbnail(pixmap, row, col)

    def update_thumbnail_size(self, size):
        self.thumbnail_widget.update_thumbnail_size(size)