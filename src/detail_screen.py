## detail_screen.py

import sys
import requests
from PyQt5.QtCore import Qt
from PyQt5.QtWidgets import QDialog, QFileDialog, QListWidget, QLabel, QLineEdit, QPushButton, QVBoxLayout, QMessageBox, QApplication, QInputDialog, QTextEdit, QHBoxLayout, QListWidget, QVBoxLayout, QPushButton, QDialogButtonBox
from PyQt5.QtGui import QPixmap, QDragEnterEvent, QDropEvent
from prompt_manager import PromptManager

class DetailScreen(QDialog):
    def __init__(self, prompt_id: int, prompt_manager: PromptManager, overview_screen):
        """
        詳細画面を初期化します。
        
        :param prompt_id: プロンプトのID。新規プロンプトの場合はNone。
        :param prompt_manager: PromptManagerインスタンス。
        :param overview_screen: OverviewScreenインスタンス。
        """
        super().__init__()
        self.prompt_id = prompt_id
        self.prompt_manager = prompt_manager
        self.overview_screen = overview_screen
        self.prompt_details = self.prompt_manager.get_prompt_details(self.prompt_id) if self.prompt_id is not None else {}
        self.image_data = None
        self.setAcceptDrops(True)
        self.init_ui()

    def init_ui(self):
        """
        ユーザーインターフェースを初期化します。
        """
        self.setWindowTitle('Prompt Details')
        self.setGeometry(100, 100, 1000, 600)

        self.titleLabel = QLabel('Title:', self)
        self.titleEdit = QLineEdit(self)
        self.titleEdit.setText(self.prompt_details.get('title', ''))

        self.promptLabel = QLabel('Prompt:', self)
        self.promptEdit = QTextEdit(self)
        self.promptEdit.setText(self.prompt_details.get('prompt', ''))

        self.descriptionLabel = QLabel('Description:', self)
        self.descriptionEdit = QTextEdit(self)
        self.descriptionEdit.setText(self.prompt_details.get('description', ''))

        self.tagLabel = QLabel('Tags:', self)
        self.tagEdit = QListWidget(self)
        if 'tags' in self.prompt_details:
            for tag in self.prompt_details['tags']:
                self.tagEdit.addItem(tag)

        self.addTagButton = QPushButton('Add New Tag', self)
        self.addTagButton.clicked.connect(self.add_tag)

        self.selectExistingTagButton = QPushButton('Select Existing Tag', self)
        self.selectExistingTagButton.clicked.connect(self.select_existing_tag)

        self.removeTagButton = QPushButton('Remove Selected Tag', self)
        self.removeTagButton.clicked.connect(self.remove_selected_tag)

        tagButtonLayout = QHBoxLayout()
        tagButtonLayout.addWidget(self.addTagButton)
        tagButtonLayout.addWidget(self.selectExistingTagButton)
        tagButtonLayout.addWidget(self.removeTagButton)

        self.imageLabel = QLabel('Image:', self)
        self.imageButton = QPushButton('Select Image', self)
        self.imageButton.clicked.connect(self.select_image)
        self.imagePathEdit = QLineEdit(self)
        self.imagePathEdit.setReadOnly(True)
        self.imagePathEdit.setText(self.prompt_details.get('image_path', ''))

        self.thumbnailLabel = QLabel(self)
        self.thumbnailLabel.setFixedSize(200, 200)
        if 'image_data' in self.prompt_details and self.prompt_details['image_data']:
            self.load_thumbnail_from_data(self.prompt_details['image_data'])

        self.saveButton = QPushButton('Save', self)
        self.saveButton.clicked.connect(self.save_prompt_details)

        layout = QVBoxLayout()
        layout.addWidget(self.titleLabel)
        layout.addWidget(self.titleEdit)
        layout.addWidget(self.promptLabel)
        layout.addWidget(self.promptEdit)
        layout.addWidget(self.descriptionLabel)
        layout.addWidget(self.descriptionEdit)
        layout.addWidget(self.tagLabel)
        layout.addWidget(self.tagEdit)
        layout.addLayout(tagButtonLayout)
        layout.addWidget(self.addTagButton)
        layout.addWidget(self.removeTagButton)
        layout.addWidget(self.imageLabel)
        layout.addWidget(self.imagePathEdit)
        layout.addWidget(self.imageButton)
        layout.addWidget(self.thumbnailLabel)
        layout.addWidget(self.saveButton)

        self.setLayout(layout)

    def dragEnterEvent(self, event: QDragEnterEvent):
        """
        ドラッグ＆ドロップイベントが発生したときに呼び出されます。
        ドロップされたデータがURLの場合、イベントを受け入れます。
        
        :param event: QDragEnterEventオブジェクト。
        """
        if event.mimeData().hasUrls():
            event.acceptProposedAction()

    def dropEvent(self, event: QDropEvent):
        """
        ドロップイベントが発生したときに呼び出されます。
        ドロップされたデータがローカルファイルの場合は画像ファイルとして処理し、
        ブラウザからドラッグされた場合はURLからダウンロードします。
        
        :param event: QDropEventオブジェクト。
        """
        if event.mimeData().hasUrls():
            url = event.mimeData().urls()[0]
            if url.isLocalFile():
                file_path = url.toLocalFile()
                self.handle_image_file(file_path)
            else:
                url_string = url.toString()
                if url_string.startswith("http://") or url_string.startswith("https://"):
                    response = requests.get(url_string)
                    if response.status_code == 200:
                        self.image_data = response.content
                        self.load_thumbnail_from_data(self.image_data)
                    else:
                        QMessageBox.warning(self, "Warning", "Failed to download the image.")
                else:
                    QMessageBox.warning(self, "Warning", "Invalid URL format.")
            event.acceptProposedAction()

    def handle_image_file(self, file_path: str):
        """
        画像ファイルを読み込み、サムネイルを表示します。
        
        :param file_path: 画像ファイルのパス。
        """
        with open(file_path, 'rb') as file:
            self.image_data = file.read()
        self.load_thumbnail_from_data(self.image_data)

    def add_tag(self):
        """
        新しいタグを追加します。
        """
        tag, ok = QInputDialog.getText(self, 'Add Tag', 'Enter a tag:')
        if ok and tag:
            self.tagEdit.addItem(tag)

    def remove_selected_tag(self):
        """
        選択されたタグを削除します。
        """
        for item in self.tagEdit.selectedItems():
            self.tagEdit.takeItem(self.tagEdit.row(item))

    def load_thumbnail_from_data(self, image_data: bytes):
        """
        画像データからサムネイルを読み込み、表示します。
        
        :param image_data: 画像データ。
        """
        pixmap = QPixmap()
        pixmap.loadFromData(image_data)
        if not pixmap.isNull():
            self.thumbnailLabel.setPixmap(pixmap.scaled(
                self.thumbnailLabel.size(),
                Qt.KeepAspectRatio,
                Qt.SmoothTransformation
            ))

    def select_existing_tag(self):
        """
        既存のタグを選択し、プロンプトに追加します。
        """
        existing_tags = self.prompt_manager.get_all_tags()

        dialog = QDialog(self)
        dialog.setWindowTitle("Select Existing Tag")
        layout = QVBoxLayout(dialog)

        list_widget = QListWidget(dialog)
        list_widget.addItems(existing_tags)
        layout.addWidget(list_widget)

        button_box = QDialogButtonBox(QDialogButtonBox.Ok | QDialogButtonBox.Cancel, dialog)
        button_box.accepted.connect(dialog.accept)
        button_box.rejected.connect(dialog.reject)
        layout.addWidget(button_box)

        if dialog.exec_() == QDialog.Accepted:
            selected_items = list_widget.selectedItems()
            if selected_items:
                selected_tag = selected_items[0].text()
                self.tagEdit.addItem(selected_tag)

    def select_image(self):
        """
        画像ファイルを選択し、サムネイルを表示します。
        """
        image_path, _ = QFileDialog.getOpenFileName(self, "Select Image", "", "Image Files (*.png *.jpg *.bmp)")
        if image_path:
            self.imagePathEdit.setText(image_path)
            with open(image_path, 'rb') as file:
                self.image_data = file.read()
            self.load_thumbnail_from_data(self.image_data)

    def save_prompt_details(self):
        """
        プロンプトの詳細を保存します。
        新規プロンプトの場合は登録し、既存のプロンプトの場合は編集します。
        """
        if self.image_data is not None:
            print(f"Image data length: {len(self.image_data)}")
        else:
            print("No image data available.")

        new_details = {
            'title': self.titleEdit.text(),
            'prompt': self.promptEdit.toPlainText(),
            'description': self.descriptionEdit.toPlainText(),
            'tags': [self.tagEdit.item(i).text() for i in range(self.tagEdit.count())],
            'image_data': self.image_data
        }
        if self.prompt_id is None:
            success = self.prompt_manager.register_prompt(new_details)
        else:
            success = self.prompt_manager.edit_prompt(self.prompt_id, new_details)

        if success:
            QMessageBox.information(self, "Success", "Prompt details saved successfully.")
            self.overview_screen.updateTagList()
            self.overview_screen.showPrompts()
        else:
            QMessageBox.warning(self, "Error", "Failed to save prompt details.")
        self.close()

    def show_prompt_details(self):
        """
        プロンプトの詳細を表示します。
        QApplicationインスタンスが存在しない場合は新しく作成します。
        """
        self.show()
        if QApplication.instance() is None:
            app = QApplication(sys.argv)
            app.exec_()
        else:
            self.exec_()