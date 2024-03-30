from PyQt5.QtWidgets import QMenu, QAction
from PyQt5.QtGui import QKeySequence
from PyQt5.QtCore import Qt

class ContextMenu(QMenu):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.init_actions()
        self.connect_actions()

    def init_actions(self):
        self.open_action = QAction("Open", self)
        self.open_action.setShortcut(QKeySequence(Qt.Key_Return))
        self.addAction(self.open_action)

        self.fav_action = QAction("Fav", self)
        self.fav_action.setShortcut(QKeySequence(Qt.Key_F))
        self.addAction(self.fav_action)

        self.nsfw_action = QAction("NSFW", self)
        self.nsfw_action.setShortcut(QKeySequence(Qt.Key_N))
        self.addAction(self.nsfw_action)

        self.trash_action = QAction("Trash", self)
        self.trash_action.setShortcut(QKeySequence(Qt.Key_Delete))
        self.addAction(self.trash_action)

    def connect_actions(self):
        self.open_action.triggered.connect(self.open_selected_images)
        self.fav_action.triggered.connect(self.toggle_fav_selected_images)
        self.nsfw_action.triggered.connect(self.toggle_nsfw_selected_images)
        self.trash_action.triggered.connect(self.trash_selected_images)

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