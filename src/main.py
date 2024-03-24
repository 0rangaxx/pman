## main.py

import sys
from PyQt5.QtWidgets import QApplication, QMainWindow
from PyQt5.QtGui import QIcon
from overview_screen import OverviewScreen

class Main:
    def start_application(self) -> None:
        """
        QApplicationインスタンスを作成し、メインウィンドウを設定してイベントループを開始します。
        """
        app = QApplication(sys.argv)
        app.setWindowIcon(QIcon("src/resources/images/icon.png"))  # アイコンを設定
        main_window = OverviewScreen()
        main_window.show()
        sys.exit(app.exec_())

if __name__ == "__main__":
    main = Main()
    main.start_application()