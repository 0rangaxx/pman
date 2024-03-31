# mainwindow.py
from PyQt5.QtWidgets import QMainWindow, QWidget, QHBoxLayout, QMenuBar, QStatusBar
from interface.right_panel import RightPanel
from interface.left_panel import LeftPanel
from managers.database_manager import DatabaseManager
from image_processor import ImageProcessor
from tag_manager import TagManager

class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setGeometry(100, 100, 1366, 768)
        self.setWindowTitle("Image Viewer")
        self.db_manager = DatabaseManager()
        self.image_processor = ImageProcessor()
        self.tag_manager = TagManager()

        self.create_menu_bar()
        self.create_status_bar()
        self.create_main_layout()
        self.setup_connections()

    def create_menu_bar(self):
        menu_bar = QMenuBar(self)
        file_menu = menu_bar.addMenu("File")
        setting_menu = menu_bar.addMenu("Setting")
        prompt_menu = menu_bar.addMenu("Prompt")
        help_menu = menu_bar.addMenu("Help")
        self.setMenuBar(menu_bar)

    def create_status_bar(self):
        status_bar = QStatusBar(self)
        status_bar.showMessage("Ready")
        self.setStatusBar(status_bar)

    def create_main_layout(self):
        central_widget = QWidget(self)
        main_layout = QHBoxLayout(central_widget)

        self.left_panel = LeftPanel()
        self.right_panel = RightPanel()

        main_layout.addWidget(self.left_panel)
        main_layout.addWidget(self.right_panel, stretch=6)

        self.setCentralWidget(central_widget)

    def setup_connections(self):
        self.left_panel.search_tags_updated.connect(self.right_panel.update_search_tags)
        self.left_panel.current_tags_updated.connect(self.right_panel.update_current_tags)
        self.right_panel.thumbnail_display_requested.connect(self.update_thumbnail_display)
        self.right_panel.tag_list_update_requested.connect(self.update_tag_list)

    def update_thumbnail_display(self):
        image_paths = self.db_manager.fetch_image_paths()
        thumbnails = [self.image_processor.generate_thumbnail(path) for path in image_paths]
        self.right_panel.update_thumbnail_display(thumbnails)

    def update_tag_list(self):
        image_paths = self.db_manager.fetch_image_paths()
        tags = [self.tag_manager.extract_tags(path) for path in image_paths]
        unique_tags = list(set([tag for sublist in tags for tag in sublist]))
        self.right_panel.update_tag_list(unique_tags)

    def show(self):
        self.db_manager.connect()
        super().show()