## main.py
import sys
from PyQt5.QtWidgets import QApplication, QMainWindow
from ui import UIManager
from database import DatabaseManager
from image_processor import ImageProcessor
from tag_manager import TagManager

class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setGeometry(100, 100, 1366, 768)
        self.ui_manager = UIManager(self)  # selfを親ウィジェットとして渡す
        self.setCentralWidget(self.ui_manager)  # UIManagerをcentralWidgetとして設定
        self.create_menu_bar()  # MainWindowクラスでメニューバーを作成
        self.statusBar().showMessage("Ready")  # MainWindowのステータスバーを表示
        self.db_manager = DatabaseManager()
        self.image_processor = ImageProcessor()
        self.tag_manager = TagManager()
        self.setup_connections()
        print("MainWindowが初期化されました")

    def setup_connections(self):
        # UIシグナルとスロットの接続
        self.ui_manager.thumbnail_display_requested.connect(self.update_thumbnail_display)
        self.ui_manager.tag_list_update_requested.connect(self.update_tag_list)
        print("UIシグナルがスロットに接続されました")

    def create_menu_bar(self):
        menu_bar = self.menuBar()
        file_menu = menu_bar.addMenu("File")
        setting_menu = menu_bar.addMenu("Setting")
        prompt_menu = menu_bar.addMenu("Prompt")
        help_menu = menu_bar.addMenu("Help")

    def show(self):
        self.db_manager.connect()
        super().show()
        print("データベースに接続し、MainWindowが表示されました")

    def update_thumbnail_display(self):
        # データベースから画像パスを取得
        image_paths = self.db_manager.fetch_image_paths()
        print(f"データベースから{len(image_paths)}個の画像パスを取得しました")

        # 各画像のサムネイルを生成
        thumbnails = [self.image_processor.generate_thumbnail(path) for path in image_paths]
        print(f"{len(thumbnails)}個のサムネイルを生成しました")

        # UIにサムネイルを更新
        self.ui_manager.update_thumbnail_display(thumbnails)
        print("サムネイル表示が更新されました")

    def update_tag_list(self):
        # データベースから画像パスを取得
        image_paths = self.db_manager.fetch_image_paths()
        print(f"データベースから{len(image_paths)}個の画像パスを取得しました")

        # 各画像のタグを抽出
        tags = [self.tag_manager.extract_tags(path) for path in image_paths]
        print(f"{len(tags)}個の画像からタグを抽出しました")

        # タグのリストをフラット化し、重複を削除
        unique_tags = list(set([tag for sublist in tags for tag in sublist]))
        print(f"{len(unique_tags)}個のユニークなタグが見つかりました")

        # UIにユニークなタグを更新
        self.ui_manager.update_tag_list(unique_tags)
        print("タグリストが更新されました")

if __name__ == "__main__":
    app = QApplication(sys.argv)
    main_window = MainWindow()
    main_window.show()
    print("アプリケーションが起動しました")
    sys.exit(app.exec_())