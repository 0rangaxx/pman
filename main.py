## main.py

import sys
from PyQt5.QtWidgets import QApplication
from overview_screen import OverviewScreen

class Main:
    def start_application(self) -> None:
        """
        QApplicationインスタンスを作成し、メインウィンドウを設定してイベントループを開始します。
        """
        app = QApplication(sys.argv)
        main_window = OverviewScreen()
        main_window.show()
        sys.exit(app.exec_())

if __name__ == "__main__":
    main = Main()
    main.start_application()