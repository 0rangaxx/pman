from PyQt5.QtWidgets import QWidget, QGridLayout, QLabel
from PyQt5.QtCore import Qt, QSize, pyqtSignal, QEvent
from PyQt5.QtGui import QPixmap, QImage
from managers.database_manager import DatabaseManager


# ThumbnailWidgetクラスはサムネイル画像を表示するためのウィジェットです
class ThumbnailWidget(QWidget):
    thumbnail_clicked = pyqtSignal(int, int, bool)  # シグナルに選択状態を追加
    thumbnail_right_clicked = pyqtSignal(QEvent, int, int)  # シグナルの定義を変更


    def __init__(self, parent=None):
        super().__init__(parent)
        self.db_manager = DatabaseManager()
        self.original_images = {}  # オリジナルの画像データを保持する辞書
        self.selected_thumbnails = set()  # 選択されたサムネイルを管理するセット
        self.selected_ids = []  # 選択中IDリストを追加
        self.setFocusPolicy(Qt.StrongFocus)  # フォーカスを受け取れるようにする
        self.init_ui()

    def init_ui(self):
        # グリッドレイアウトを初期化します
        self.grid_layout = QGridLayout()
        self.grid_layout.setHorizontalSpacing(1)
        self.grid_layout.setVerticalSpacing(1)
        self.setLayout(self.grid_layout)
        self.thumbnail_size = QSize(300, 300)

    def add_thumbnail(self, image_data, row, col, image_id):
        qimage = QImage.fromData(image_data)
        pixmap = QPixmap.fromImage(qimage)
        # 新しいサムネイル画像をグリッドレイアウトに追加します
        label = QLabel()
        label.setPixmap(pixmap.scaled(self.thumbnail_size, Qt.KeepAspectRatio, Qt.SmoothTransformation))
        label.setAlignment(Qt.AlignCenter)  # ラベルの内容を中央揃えにする
        self.grid_layout.addWidget(label, row, col)
        self.grid_layout.setRowStretch(row, 1)  # 行の伸縮を設定
        self.grid_layout.setColumnStretch(col, 1)  # 列の伸縮を設定
        self.original_images[(row, col)] = (image_data, image_id)  # IDも一緒に保持
        label.mousePressEvent = lambda event, r=row, c=col: self.mousePressEvent(event, r, c)  # マウスイベントを修正

    def keyPressEvent(self, event):
        if event.modifiers() & Qt.ControlModifier and event.key() == Qt.Key_A:
            self.select_all_thumbnails()
        elif event.key() == Qt.Key_F:
            self.toggle_fav_selected_images()
        elif event.key() == Qt.Key_N: 
            self.toggle_nsfw_selected_images()
        elif event.key() == Qt.Key_Delete:
            self.toggle_trash_selected_images()
        else:
            super().keyPressEvent(event)

    def select_all_thumbnails(self):
        self.selected_thumbnails.clear()
        for i in range(self.grid_layout.rowCount()):
            for j in range(self.grid_layout.columnCount()):
                self.selected_thumbnails.add((i, j))
                self.highlight_thumbnail(i, j)  # 引数を3つに変更
    
    def mousePressEvent(self, event, row=None, col=None):
        if row == None:
            return
        modifiers = event.modifiers()  # 修飾キーの状態を取得
        if event.button() == Qt.RightButton:
            if len(self.selected_thumbnails) <= 1:
                self.selected_thumbnails.clear()  # 選択状態をクリア
                self.selected_thumbnails.add((row, col))  # 新しく選択状態を追加
            self.highlight_thumbnail(row, col)
            self.thumbnail_right_clicked.emit(event, row, col)  # 右クリック時にシグナルを発信し、イベント、行、列を含める
        else:
            if modifiers & Qt.ControlModifier:
                if (row, col) in self.selected_thumbnails:
                    self.selected_thumbnails.remove((row, col))
                    _, image_id = self.original_images[(row, col)]
                    self.selected_ids.remove(image_id)  # IDリストから除外
                    self.unhighlight_thumbnail(row, col)
                else:
                    self.selected_thumbnails.add((row, col))
                    _, image_id = self.original_images[(row, col)]
                    self.selected_ids.append(image_id)  # IDリストに追加
                    self.highlight_thumbnail(row, col)
            elif modifiers & Qt.ShiftModifier:
                # 範囲選択の処理を追加
                if self.selected_thumbnails:
                    start_row, start_col = min(self.selected_thumbnails)
                    self.selected_thumbnails.clear()
                    for i in range(min(start_row, row), max(start_row, row) + 1):
                        for j in range(self.grid_layout.columnCount()):
                            if (min(start_col, col) <= j <= max(start_col, col)):
                                self.selected_thumbnails.add((i, j))
                                _, image_id = self.original_images[(i, j)]
                                self.selected_ids.append(image_id)  # IDリストに追加
                                self.highlight_thumbnail(i, j)
                else:
                    self.selected_thumbnails.add((row, col))
                    self.highlight_thumbnail(row, col)
            else:
                self.selected_thumbnails.clear()  # 選択状態をクリア
                self.selected_ids.clear()  # IDリストをクリア
                for i in range(self.grid_layout.rowCount()):
                    for j in range(self.grid_layout.columnCount()):
                        self.unhighlight_thumbnail(i, j)
                self.selected_thumbnails.add((row, col))
                _, image_id = self.original_images[(row, col)]
                self.selected_ids.append(image_id)  # IDリストに追加
                self.highlight_thumbnail(row, col)
        self.thumbnail_clicked.emit(row, col, modifiers & Qt.ControlModifier)  # 選択状態を通知



    def highlight_thumbnail(self, row, col):
        item = self.grid_layout.itemAtPosition(row, col)
        if item:
            label = item.widget()
            label.setStyleSheet("background-color: rgba(0, 0, 255, 0.3);")  # 選択状態のハイライトを設定

    def unhighlight_thumbnail(self, row, col):
        item = self.grid_layout.itemAtPosition(row, col)
        if item:
            label = item.widget()
            label.setStyleSheet("background-color: none;")  # 選択状態を解除

    def clear_thumbnails(self):
        # すべてのサムネイル画像を削除します
        while self.grid_layout.count():
            item = self.grid_layout.takeAt(0)
            widget = item.widget()
            if widget:
                widget.deleteLater()
        self.original_images.clear()  # オリジナルの画像データもクリア
        self.selected_thumbnails.clear()
        self.selected_ids.clear()  # IDリストをクリア
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

    def toggle_fav_selected_images(self):
        selected_ids = []
        for pos in self.selected_thumbnails:
            if pos in self.original_images:
                _, image_id = self.original_images[pos]
                selected_ids.append(image_id)
            else:
                print(f"Warning: Position {pos} not found in original_images")

        for image_id in selected_ids:
            attributes = self.db_manager.retrieve_image_attributes(image_id)
            if attributes:
                attributes['fav_flag'] = 1 - attributes['fav_flag']
                self.db_manager.update_image_attributes(image_id, attributes)

    def toggle_nsfw_selected_images(self):  # ← この関数を追加
        selected_ids = []
        for pos in self.selected_thumbnails:
            if pos in self.original_images:
                _, image_id = self.original_images[pos]
                selected_ids.append(image_id)
            else:
                print(f"Warning: Position {pos} not found in original_images")

        for image_id in selected_ids:
            attributes = self.db_manager.retrieve_image_attributes(image_id)
            if attributes:
                attributes['nsfw_flag'] = 1 - attributes['nsfw_flag']
                self.db_manager.update_image_attributes(image_id, attributes)

    def toggle_trash_selected_images(self):
        selected_ids = []
        for pos in self.selected_thumbnails:
            if pos in self.original_images:
                _, image_id = self.original_images[pos]
                selected_ids.append(image_id)
            else:
                print(f"Warning: Position {pos} not found in original_images")

        for image_id in selected_ids:
            attributes = self.db_manager.retrieve_image_attributes(image_id)
            if attributes:
                attributes['trash_flag'] = 1 - attributes['trash_flag']
                self.db_manager.update_image_attributes(image_id, attributes)