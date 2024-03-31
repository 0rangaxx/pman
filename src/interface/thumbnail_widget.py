from PyQt5.QtWidgets import QWidget, QGridLayout, QLabel
from PyQt5.QtCore import Qt, QSize
from PyQt5.QtGui import QPixmap, QImage

# ThumbnailWidgetクラスはサムネイル画像を表示するためのウィジェットです
class ThumbnailWidget(QWidget):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.original_images = {}  # オリジナルの画像データを保持する辞書
        self.init_ui()

    def init_ui(self):
        # グリッドレイアウトを初期化します
        self.grid_layout = QGridLayout()
        self.grid_layout.setHorizontalSpacing(1)
        self.grid_layout.setVerticalSpacing(1)
        self.setLayout(self.grid_layout)
        self.thumbnail_size = QSize(300, 300)

    def add_thumbnail(self, image_data, row, col):
        qimage = QImage.fromData(image_data)
        pixmap = QPixmap.fromImage(qimage)
        # 新しいサムネイル画像をグリッドレイアウトに追加します
        label = QLabel()
        label.setPixmap(pixmap.scaled(self.thumbnail_size, Qt.KeepAspectRatio, Qt.SmoothTransformation))
        label.setAlignment(Qt.AlignCenter)  # ラベルの内容を中央揃えにする
        self.grid_layout.addWidget(label, row, col)
        self.grid_layout.setRowStretch(row, 1)  # 行の伸縮を設定
        self.grid_layout.setColumnStretch(col, 1)  # 列の伸縮を設定
        self.original_images[(row, col)] = image_data  # オリジナルの画像データを保持

    def clear_thumbnails(self):
        # すべてのサムネイル画像を削除します
        while self.grid_layout.count():
            item = self.grid_layout.takeAt(0)
            widget = item.widget()
            if widget:
                widget.deleteLater()
        self.original_images.clear()  # オリジナルの画像データもクリア
        print("すべてのサムネイル画像が削除されました")

    def update_thumbnail_size(self, size):
        self.thumbnail_size = size
        for i in range(self.grid_layout.rowCount()):
            for j in range(self.grid_layout.columnCount()):
                item = self.grid_layout.itemAtPosition(i, j)
                if item:
                    label = item.widget()
                    image_data = self.original_images.get((i, j))
                    if image_data:
                        qimage = QImage.fromData(image_data)
                        pixmap = QPixmap.fromImage(qimage)
                        label.setPixmap(pixmap.scaled(self.thumbnail_size, Qt.KeepAspectRatio, Qt.SmoothTransformation))
                    label.setAlignment(Qt.AlignCenter)
                    self.grid_layout.setRowStretch(i, 1)
                    self.grid_layout.setColumnStretch(j, 1)
        print(f"サムネイル画像のサイズが{self.thumbnail_size}に更新されました")

    def wheelEvent(self, event):
        if event.modifiers() & Qt.ControlModifier:
            # Ctrl + ホイールでサムネイル画像のサイズを変更します
            delta = event.angleDelta().y()
            if delta > 0:
                self.thumbnail_size *= 1.1
            else:
                self.thumbnail_size /= 1.1
            self.thumbnail_size = self.thumbnail_size.expandedTo(QSize(64, 64))
            self.thumbnail_size = self.thumbnail_size.boundedTo(QSize(1024, 1024))
            self.update_thumbnail_size(self.thumbnail_size)
            event.accept()
        else:
            super().wheelEvent(event)