## main.py
import sys, os
from PyQt5.QtWidgets import QApplication, QMainWindow
from managers.ui_manager import UIManager
from managers.database_manager import DatabaseManager
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

    # def on_directory_selected(self, directory):
        
    def setup_connections(self):
        # UIシグナルとスロットの接続
        self.ui_manager.thumbnail_display_requested.connect(self.ui_manager.display_thumbnails)
        self.ui_manager.left_panel.current_tags_updated.connect(self.ui_manager.left_panel.update_current_tags)

        # 設定ファイルにdirectoryの設定がある場合、そのディレクトリを読み込む
        directory = self.ui_manager.config_manager.get_directory()
        if directory and os.path.exists(directory):
            self.ui_manager.on_directory_button_clicked(directory)
        else:
            self.ui_manager.on_directory_button_clicked(None)
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

if __name__ == "__main__":
    app = QApplication(sys.argv)
    main_window = MainWindow()
    main_window.show()
    print("アプリケーションが起動しました")
    sys.exit(app.exec_())