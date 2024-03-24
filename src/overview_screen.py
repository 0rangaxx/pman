## overview_screen.py

from PyQt5.QtCore import Qt
from PyQt5.QtWidgets import QMainWindow, QWidget, QVBoxLayout, QLineEdit, QPushButton, QListWidget, QListWidgetItem, QMessageBox, QHBoxLayout, QLabel, QTextEdit, QApplication
from PyQt5.QtGui import QPixmap, QIcon
from prompt_manager import PromptManager

class CustomQListWidgetItem(QListWidgetItem):
    def __init__(self, title, prompt, description, image_data, prompt_id, parent=None):
        super(CustomQListWidgetItem, self).__init__(parent)
        self.title = title
        self.prompt = prompt
        self.description = description
        self.prompt_details = {}
        self.prompt_id = prompt_id  # プロンプトIDを格納
        self.image_data = image_data

    def __repr__(self):
        return f'{self.title} - {self.description}'

class OverviewScreen(QMainWindow):
    def __init__(self, parent=None):
        super(OverviewScreen, self).__init__(parent)
        self.prompt_manager = PromptManager()
        self.initUI()

    def initUI(self):
        self.setWindowTitle('Prompt Overview')  # ウィンドウタイトルを設定
        self.setGeometry(100, 100, 1280, 720)  # ウィンドウの位置とサイズを設定

        centralWidget = QWidget(self)  # 中央ウィジェットを作成
        self.setCentralWidget(centralWidget)  # 中央ウィジェットを設定

        mainLayout = QVBoxLayout(centralWidget)  # メインレイアウトを作成

        #全体上部ウィジェット
        upperWidget = QWidget(centralWidget)  # 上部ウィジェットを作成
        upperLayout = QHBoxLayout(upperWidget)  # 上部レイアウトを作成
        mainLayout.addWidget(upperWidget, stretch=3)  # メインレイアウトに上部ウィジェットを追加

        # プロンプト一覧 (左側 3/2)
        leftWidget = QWidget(upperWidget)  # 左側のウィジェットを作成（upperWidgetを親に変更）
        leftLayout = QVBoxLayout(leftWidget)  # 左側のレイアウトを作成
        upperLayout.addWidget(leftWidget, stretch=1)  # 上部レイアウトに左側のウィジェットを追加

        self.searchField = QLineEdit(centralWidget)  # 検索フィールドを作成
        self.searchField.setPlaceholderText("Search prompts...")  # プレースホルダーテキストを設定
        leftLayout.addWidget(self.searchField)  # 左側のレイアウトに検索フィールドを追加

        searcheButtonLayout = QHBoxLayout()  # 検索ボタンのレイアウトを作成
       
        self.searchButton = QPushButton("Search", centralWidget)  # 検索ボタンを作成
        self.searchButton.clicked.connect(self.onSearchClicked)  # 検索ボタンのクリックイベントを設定
        searcheButtonLayout.addWidget(self.searchButton)  # 検索ボタンレイアウトに検索ボタンを追加

        self.refreshButton = QPushButton("Clear", centralWidget)  # リフレッシュボタンを作成
        self.refreshButton.clicked.connect(self.refreshPrompts)  # リフレッシュボタンのクリックイベントを設定
        searcheButtonLayout.addWidget(self.refreshButton)  # 検索ボタンレイアウトにリフレッシュボタンを追加

        leftLayout.addLayout(searcheButtonLayout)  # 左側のレイアウトに検索ボタンレイアウトを追加

        self.promptList = QListWidget(centralWidget)  # プロンプトリストを作成
        self.promptList.currentItemChanged.connect(self.onItemClicked)  # プロンプトリストのアイテム変更イベントを設定
        self.promptList.itemClicked.connect(self.onItemClicked)  # プロンプトリストのアイテムクリックイベントを設定
        self.promptList.itemDoubleClicked.connect(self.onItemDoubleClicked)  # プロンプトリストのアイテムダブルクリックイベントを設定
        leftLayout.addWidget(self.promptList)  # 左側のレイアウトにプロンプトリストを追加

        self.showPrompts()  # プロンプトを表示

        promptButtonLayout = QHBoxLayout()  # プロンプトボタンのレイアウトを作成
        self.newPromptButton = QPushButton("New Prompt", centralWidget)  # 新規プロンプトボタンを作成
        self.newPromptButton.clicked.connect(self.onNewPromptClicked)  # 新規プロンプトボタンのクリックイベントを設定
        promptButtonLayout.addWidget(self.newPromptButton)  # プロンプトボタンレイアウトに新規プロンプトボタンを追加

        self.deletePromptButton = QPushButton("Delete Selected Prompt", centralWidget)  # 選択プロンプト削除ボタンを作成
        self.deletePromptButton.clicked.connect(self.onDeletePromptClicked)  # 選択プロンプト削除ボタンのクリックイベントを設定
        promptButtonLayout.addWidget(self.deletePromptButton)  # プロンプトボタンレイアウトに選択プロンプト削除ボタンを追加

        leftLayout.addLayout(promptButtonLayout)  # 左側のレイアウトにプロンプトボタンレイアウトを追加

        # サムネイルとタグリスト (右側 1/2)
        rightWidget = QWidget(upperWidget)  # 右側のウィジェットを作成（upperWidgetを親に変更）
        rightLayout = QVBoxLayout(rightWidget)  # 右側のレイアウトを作成
        upperLayout.addWidget(rightWidget, stretch=1)  # 上部レイアウトに右側のウィジェットを追加

        # サムネイル (右上部 1/2)
        r1Widget = QWidget(rightWidget)  # サムネイル用のウィジェットを作成
        r1Layout = QVBoxLayout(r1Widget)  # サムネイル用のレイアウトを作成
        rightLayout.addWidget(r1Widget, stretch=1)  # 右側のレイアウトにサムネイル用のウィジェットを追加

        self.thumbnailLabel = QLabel(r1Widget)  # サムネイル用のラベルを作成
        r1Layout.addWidget(self.thumbnailLabel)  # サムネイル用のレイアウトにサムネイル用のラベルを追加

        # タグリスト (右下部 1/2)
        r2Widget = QWidget(rightWidget)  # タグリスト用のウィジェットを作成
        r2Layout = QVBoxLayout(r2Widget)  # タグリスト用のレイアウトを作成
        rightLayout.addWidget(r2Widget, stretch=1)  # 右側のレイアウトにタグリスト用のウィジェットを追加
        self.tagList = QListWidget(r2Widget)  # タグリストを作成
        self.tagList.setWindowTitle('Tags')  # タグリストのウィンドウタイトルを設定
        r2Layout.addWidget(self.tagList)  # タグリスト用のレイアウトにタグリストを追加
        self.tagList.itemClicked.connect(self.onTagClicked)  # タグリストのアイテムクリックイベントを設定

        self.updateTagList()  # タグリストを更新

        #全体下部レイアウト
        downWidget = QWidget(centralWidget)  # 下部ウィジェットを作成
        downLayout = QHBoxLayout(downWidget)  # 下部レイアウトを作成
        mainLayout.addWidget(downWidget, stretch=1)  # メインレイアウトに下部ウィジェットを追加
        # プロンプト作成欄の追加
        promptEditWidget = QWidget(downWidget)  # プロンプト作成欄用のウィジェットを作成
        promptEditLayout = QHBoxLayout(promptEditWidget)  # プロンプト作成欄用のレイアウトを作成
        self.promptEditLabel = QLabel('Prompt Editor:', promptEditWidget)
        self.promptEditBox = QTextEdit(promptEditWidget)
        promptEditLayout.addWidget(self.promptEditLabel)
        promptEditLayout.addWidget(self.promptEditBox)
        # コピーボタン、クリアボタンの追加
        self.copyPromptButton = QPushButton('Copy', promptEditWidget)
        self.copyPromptButton.clicked.connect(self.onCopyPromptClicked)
        self.clearPromptButton = QPushButton('Clear', promptEditWidget)
        self.clearPromptButton.clicked.connect(self.onClearPromptClicked)
        buttonLayout = QVBoxLayout()
        buttonLayout.addWidget(self.copyPromptButton)
        buttonLayout.addWidget(self.clearPromptButton)
        promptEditLayout.addLayout(buttonLayout)

        downLayout.addWidget(promptEditWidget, stretch=1)  # 全体下部レイアウトにプロンプト作成欄用のウィジェットを追加

    def updateTagList(self):
        self.tagList.clear()  # タグリストをクリア
        all_tags = self.prompt_manager.get_all_tags()  # 全てのタグを取得
        for tag in sorted(all_tags):
            self.tagList.addItem(tag)  # タグリストにタグを追加

    def onTagClicked(self, item):
        tag = item.text()  # クリックされたタグのテキストを取得
        self.filterPrompts(tag=tag)  # タグでプロンプトをフィルタリング

    def refreshPrompts(self):
        self.searchField.clear()  # 検索フィールドをクリア
        self.promptList.clearSelection()  # プロンプトリストの選択をクリア
        self.thumbnailLabel.clear()  # サムネイルラベルをクリア
        self.showPrompts()  # プロンプトを表示
        self.updateTagList()  # タグリストを更新

           
    def showPrompts(self):
        self.promptList.clear()  # プロンプトリストをクリア
        prompts = self.prompt_manager.get_prompts()  # プロンプトを取得
        for prompt in prompts:
            item = CustomQListWidgetItem(prompt['title'],prompt['prompt'], prompt['description'], prompt['image_data'], prompt['id'])  # カスタムQListWidgetItemを作成
            self.promptList.addItem(item)  # プロンプトリストにアイテムを追加
            item.setText(f'{item.title} - {item.description}')  # アイテムのテキストを設定

    def onNewPromptClicked(self):
        from detail_screen import DetailScreen  # 循環インポートを避けるためにここでインポート
        detail_screen = DetailScreen(None, self.prompt_manager, self)  # 新規プロンプトの場合はprompt_idをNoneに設定
        detail_screen.show_prompt_details()  # プロンプトの詳細を表示
        detail_screen.activateWindow()  # 詳細画面をアクティブにする

    def onDeletePromptClicked(self):
        selected_item = self.promptList.currentItem()  # 選択されているアイテムを取得
        if isinstance(selected_item, CustomQListWidgetItem):
           prompt_id = selected_item.prompt_id  # プロンプトIDを取得
           confirmation = QMessageBox.question(self, "Confirm Deletion", f"Are you sure you want to delete the prompt '{selected_item.title}'?", QMessageBox.Yes | QMessageBox.No)  # 削除の確認ダイアログを表示
           if confirmation == QMessageBox.Yes:
               success = self.prompt_manager.delete_prompt(prompt_id)  # プロンプトを削除
               if success:
                   self.promptList.takeItem(self.promptList.row(selected_item))  # プロンプトリストからアイテムを削除
                   QMessageBox.information(self, "Success", "Prompt deleted successfully.")  # 削除成功のメッセージを表示
               else:
                   QMessageBox.warning(self, "Error", "Failed to delete the prompt.")  # 削除失敗のメッセージを表示
        else:
            QMessageBox.warning(self, "Error", "No prompt selected.")  # プロンプトが選択されていない場合のメッセージを表示

    def onSearchClicked(self):
        keyword = self.searchField.text()  # 検索フィールドのテキストを取得
        self.searchPrompts(keyword)  # プロンプトを検索

    def searchPrompts(self, keyword: str):
       self.filterPrompts(keyword=keyword)  # キーワードでプロンプトをフィルタリング

    def filterPrompts(self, keyword: str = None, tag: str = None):
        self.promptList.clear()  # プロンプトリストをクリア
        prompts = self.prompt_manager.get_prompts()  # プロンプトを取得
        if keyword:
            keyword = keyword.lower()  # キーワードを小文字に変換
            filtered_prompts = [prompt for prompt in prompts if
                                keyword in prompt['title'].lower() or
                                keyword in prompt['prompt'].lower() or
                                keyword in prompt['description'].lower()]  # キーワードでフィルタリング
        elif tag:
            filtered_prompts = [prompt for prompt in prompts if tag in prompt['tags']]  # タグでフィルタリング
        else:
            filtered_prompts = prompts  # フィルタリングなしの場合は全てのプロンプト
        for prompt in filtered_prompts:
            item = CustomQListWidgetItem(prompt['title'], prompt['prompt'], prompt['description'], prompt['image_data'], prompt['id'])  # カスタムQListWidgetItemを作成
            self.promptList.addItem(item)  # プロンプトリストにアイテムを追加
            item.setText(f'{item.title} - {item.description}')  # アイテムのテキストを設定

    def onItemClicked(self, item):
        self.thumbnailLabel.clear()  # サムネイルをクリア
        if isinstance(item, CustomQListWidgetItem):
            self.prompt_details = self.prompt_manager.get_prompt_details(item.prompt_id) if item.prompt_id is not None else {}  # プロンプトの詳細を取得
            image_data = self.prompt_details.get('image_data', None)  # 画像データを取得
            if image_data is not None:
                print(f"Prompt details image data length: {len(image_data)}")  # 画像データの長さを出力
            else:
                print("No image data available.")  # 画像データが存在しない場合のメッセージを出力
            self.load_thumbnail_from_data(image_data)  # サムネイルを読み込む
        else:
            print("Selected item is not a CustomQListWidgetItem instance.")  # 選択されたアイテムがCustomQListWidgetItemでない場合のメッセージを出力

    def onItemDoubleClicked(self, item):
       from detail_screen import DetailScreen  # 循環インポートを避けるためにここでインポート
       if isinstance(item, CustomQListWidgetItem):
           detail_screen = DetailScreen(item.prompt_id, self.prompt_manager, self)  # 詳細画面を作成
           detail_screen.show_prompt_details()  # プロンプトの詳細を表示
           detail_screen.activateWindow()  # 詳細画面をアクティブにする
       else:
           QMessageBox.warning(self, "Error", "Failed to open prompt details.")  # プロンプトの詳細を開けなかった場合のメッセージを表示

    def sortPrompts(self, criteria: str):
       # このメソッドは、レガシーコードからの変更の一部ではないと仮定して、そのまま残しています。
       pass

    def load_thumbnail_from_data(self, image_data: bytes):
        if image_data is not None:
            pixmap = QPixmap()
            pixmap.loadFromData(image_data)
            if not pixmap.isNull():
                # 画像のアスペクト比を取得
                aspect_ratio = pixmap.width() / pixmap.height()

                # サムネイルの表示領域のサイズを取得
                label_width = self.thumbnailLabel.width()
                label_height = self.thumbnailLabel.height()

                # # アスペクト比を維持したままサムネイルのサイズを計算
                # if aspect_ratio > label_width / label_height:
                #     thumbnail_width = label_width
                #     thumbnail_height = int(thumbnail_width / aspect_ratio)
                # else:
                #     thumbnail_height = label_height
                #     thumbnail_width = int(thumbnail_height * aspect_ratio)

                # サムネイルをリサイズ
                pixmap_resized = pixmap.scaled(
                    label_width,
                    label_height,
                    Qt.KeepAspectRatio,
                    Qt.SmoothTransformation
                )

                # サムネイルをラベルの中央に配置
                self.thumbnailLabel.setPixmap(pixmap_resized)
                self.thumbnailLabel.setAlignment(Qt.AlignCenter)
        else:
            print("No image data to load thumbnail")
            self.thumbnailLabel.clear()
    def onCopyPromptClicked(self):
        # プロンプト作成欄の内容をクリップボードにコピー
        QApplication.clipboard().setText(self.promptEditBox.toPlainText())

    def onClearPromptClicked(self):
        # プロンプト作成欄の内容をクリア
        self.promptEditBox.clear()