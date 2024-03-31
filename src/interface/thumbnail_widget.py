from PyQt5.QtWidgets import QWidget, QGridLayout, QLabel
from PyQt5.QtCore import Qt, QSize, pyqtSignal, QEvent
from PyQt5.QtGui import QPixmap, QImage


# ThumbnailWidgetクラスはサムネイル画像を表示するためのウィジェットです
class ThumbnailWidget(QWidget):
    thumbnail_clicked = pyqtSignal(int, int, bool)  # シグナルに選択状態を追加
    thumbnail_right_clicked = pyqtSignal(QEvent, int, int)  # シグナルの定義を変更


    def __init__(self, parent=None):
        super().__init__(parent)
        self.original_images = {}  # オリジナルの画像データを保持する辞書
        self.selected_thumbnails = set()  # 選択されたサムネイルを管理するセット
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
        label.mousePressEvent = lambda event, r=row, c=col: self.mousePressEvent(event, r, c)  # マウスイベントを修正

    
    def mousePressEvent(self, event, row, col):
        modifiers = event.modifiers()  # 修飾キーの状態を取得
        if event.button() == Qt.RightButton:
            if (row, col) not in self.selected_thumbnails:
                if not self.selected_thumbnails:
                    self.selected_thumbnails.clear()  # 選択状態が空の場合のみクリア
                self.selected_thumbnails.add((row, col))  # 新しく選択状態を追加
            self.highlight_thumbnail(row, col, modifiers & Qt.ControlModifier)
            self.thumbnail_right_clicked.emit(event, row, col)  # 右クリック時にシグナルを発信し、イベント、行、列を含める
        else:
            # 以下は変更なし
            if modifiers & Qt.ControlModifier:  # Ctrlキーが押されている場合
                if (row, col) in self.selected_thumbnails:
                    self.selected_thumbnails.remove((row, col))  # 選択状態を解除
                else:
                    self.selected_thumbnails.add((row, col))  # 選択状態を追加
            else:
                self.selected_thumbnails.clear()  # 選択状態をクリア
                self.selected_thumbnails.add((row, col))  # 新しく選択状態を追加
        self.thumbnail_clicked.emit(row, col, modifiers & Qt.ControlModifier)  # 選択状態を通知


    def highlight_thumbnail(self, row, col, ctrl_pressed):
        item = self.grid_layout.itemAtPosition(row, col)
        if item:
            label = item.widget()
            if (row, col) in self.selected_thumbnails:
                label.setStyleSheet("background-color: rgba(0, 0, 255, 0.3);")  # 選択状態のハイライトを設定
                # label.setStyleSheet("border: 2px solid red;")  # 選択状態のハイライトを設定
            else:
                label.setStyleSheet("background-color: none;")  # 選択状態を解除
                # label.setStyleSheet("border: none;")  # 選択状態を解除

        if not ctrl_pressed:
            for i in range(self.grid_layout.rowCount()):
                for j in range(self.grid_layout.columnCount()):
                    if (i, j) != (row, col):
                        item = self.grid_layout.itemAtPosition(i, j)
                        if item:
                            label = item.widget()
                            label.setStyleSheet("background-color: none;")  # 他の選択状態を解除

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