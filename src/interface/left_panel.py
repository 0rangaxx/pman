## left_panel.py
from PyQt5.QtWidgets import QWidget, QVBoxLayout, QHBoxLayout, QLabel, QComboBox, QPushButton, QCheckBox, QLineEdit, QListWidget, QCompleter
from PyQt5 import QtCore
from PyQt5.QtCore import pyqtSignal, QStringListModel
from collections import Counter

class LeftPanel(QWidget):
    search_tags_updated = pyqtSignal(list)
    current_tags_updated = pyqtSignal(list)

    def __init__(self, parent=None, delimiter=','):  # delimiterを引数で受け取る
        super().__init__(parent)
        self.delimiter = delimiter  # delimiterをインスタンス変数に設定
        self.setup_ui()
        self.setup_connections()
        self.searching_tags = []
        self.setup_search_completer()

    def setup_ui(self):
        main_layout = QVBoxLayout(self)

        sort_layout = QHBoxLayout()
        self.sort_combo = QComboBox()
        self.sort_combo.addItems(["更新日時", "レーティング", "ファイル名"])
        self.sort_order_button = QPushButton("△")
        sort_layout.addWidget(QLabel("ソート設定:"))
        sort_layout.addWidget(self.sort_combo)
        sort_layout.addWidget(self.sort_order_button)
        main_layout.addLayout(sort_layout)

        flag_layout = QHBoxLayout()
        self.nsfw_check = QCheckBox("NSFW")
        self.fav_check = QCheckBox("Fav")
        self.trash_check = QCheckBox("Trash")
        flag_layout.addWidget(self.nsfw_check)
        flag_layout.addWidget(self.fav_check)
        flag_layout.addWidget(self.trash_check)
        main_layout.addLayout(flag_layout)

        search_layout = QHBoxLayout()
        self.search_edit = QLineEdit()
        self.search_button = QPushButton("検索")
        self.clear_button = QPushButton("クリア")
        search_layout.addWidget(self.search_edit)
        search_layout.addWidget(self.search_button)
        search_layout.addWidget(self.clear_button)
        main_layout.addLayout(search_layout)

        self.search_tag_list = QListWidget()
        main_layout.addWidget(QLabel("現在検索中タグ:"))
        main_layout.addWidget(self.search_tag_list)

        self.current_tag_list = QListWidget()
        main_layout.addWidget(QLabel("現在表示中タグ:"))
        main_layout.addWidget(self.current_tag_list)

        show_overview_button = QPushButton("Tag Manager")
        show_overview_button.clicked.connect(self.show_overview)
        main_layout.addWidget(show_overview_button)

    def setup_connections(self):
        self.search_button.clicked.connect(self.update_search_tags)
        self.clear_button.clicked.connect(self.clear_search_tags)
        self.search_edit.returnPressed.connect(self.update_search_tags) 
        self.current_tag_list.itemDoubleClicked.connect(self.on_current_tag_double_clicked)

    def setup_search_completer(self):
        completer = QCompleter(self)
        completer.setCaseSensitivity(QtCore.Qt.CaseInsensitive)
        completer.setCompletionMode(QCompleter.PopupCompletion)
        self.search_edit.setCompleter(completer)

        def update_completer_model():
            word_list = [item.text().split(' (')[0] for item in self.current_tag_list.findItems("*", QtCore.Qt.MatchWildcard)]
            model = QStringListModel(word_list, completer)
            completer.setModel(model)

        self.current_tag_list.model().rowsInserted.connect(lambda: update_completer_model())
        self.current_tag_list.model().rowsRemoved.connect(lambda: update_completer_model())
        update_completer_model()

    def update_search_tags(self):
        search_text = self.search_edit.text()
        if search_text:
            search_tags = search_text.split(',')
            self.searching_tags.extend(search_tags)
            self.search_tag_list.clear()
            self.search_tag_list.addItems(self.searching_tags)
            self.search_tags_updated.emit(self.searching_tags)
            self.search_edit.clear()  # 追加

    def clear_search_tags(self):
        self.search_edit.clear()
        self.searching_tags = []
        self.search_tag_list.clear()
        self.search_tags_updated.emit([])


    def update_current_tags(self, current_tags):
        """
        現在のタグリストを更新する
        """
        if current_tags is not None:
            word_list = []
            for tags in current_tags:
                if isinstance(tags, str):  # tagsが文字列であることを確認
                    words = tags.split(self.delimiter)
                    words = [word.strip() for word in words if word.strip()]
                    word_list.extend(words)

            word_counts = Counter(word_list)

            word_list_with_counts = [f"{word} ({count})" for word, count in word_counts.items()]
            sorted_word_list_with_counts = sorted(word_list_with_counts)
            self.current_tag_list.clear()
            self.current_tag_list.addItems(sorted_word_list_with_counts)
        
        else:
            self.current_tag_list.clear()

    def on_current_tag_double_clicked(self, item):
        tag = item.text().split(' (')[0]  # タグ文字列を取得
        self.search_edit.clear()  # 検索窓をクリア
        self.search_edit.setText(tag)  # タグを検索窓に挿入
        self.update_search_tags()  # 検索タグを更新

    def show_overview(self):
        # OverviewScreenを表示する処理を追加
        pass