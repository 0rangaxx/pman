from PyQt5.QtWidgets import QWidget, QVBoxLayout, QHBoxLayout, QPushButton, QLineEdit, QScrollArea, QFileDialog
from interface.thumbnail_widget import ThumbnailWidget
from interface.context_menu import ContextMenu
from PyQt5.QtCore import pyqtSignal, QPoint, Qt

class RightPanel(QWidget):
    # ディレクトリ選択時に発信されるシグナル
    directory_selected = pyqtSignal(str)  

    def __init__(self, parent=None):
        super().__init__(parent)
        self.directory_button = QPushButton("ディレクトリ選択")
        self.init_ui()
        self.directory_button.clicked.connect(self.open_directory_dialog)  # ディレクトリ選択ボタンがクリックされたときの処理を設定
        self.thumbnail_widget.thumbnail_clicked.connect(self.thumbnail_widget.highlight_thumbnail)  # シグナルとスロットを修正
        self.thumbnail_widget.thumbnail_right_clicked.connect(self.show_context_menu)


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
        self.thumbnail_widget.setFocus()  # ThumbnailWidgetにフォーカスを設定
        self.scroll_area.setWidget(self.thumbnail_widget)
        layout.addWidget(self.scroll_area)

        self.setLayout(layout)

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

    def add_thumbnail(self, pixmap, row, col, image_id):  # image_idを引数として受け取る
        self.thumbnail_widget.add_thumbnail(pixmap, row, col, image_id)  # image_idを引数として渡す

    def update_thumbnail_size(self, size):
        self.thumbnail_widget.update_thumbnail_size(size)

    def show_context_menu(self, event, row, col):
        context_menu = ContextMenu(self)
        thumbnail_pos = self.thumbnail_widget.grid_layout.itemAtPosition(row, col).geometry().topLeft()
        global_pos = self.thumbnail_widget.mapToGlobal(thumbnail_pos) + event.pos()
        modifiers = event.modifiers()  # 修飾キーの状態を取得
        if modifiers & (Qt.ControlModifier | Qt.ShiftModifier):
            # Ctrl+左クリックまたはShift+左クリックの場合は選択状態を変化させない
            pass
        else:
            # 複数選択状態でサムネイルを右クリックした場合は選択状態を変化させない
            if len(self.thumbnail_widget.selected_thumbnails) <= 1:
                if (row, col) not in self.thumbnail_widget.selected_thumbnails:
                    self.thumbnail_widget.selected_thumbnails.clear()  # 選択状態をクリア
                    self.thumbnail_widget.selected_thumbnails.add((row, col))  # 新しく選択状態を追加
        context_menu.exec_(global_pos)