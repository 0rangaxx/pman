# config_manager.py

import configparser
import os

class ConfigManager:
    def __init__(self, config_file='config.ini'):
        self.config_file = config_file
        self.config = configparser.ConfigParser()
        self.delimiter = ','
        self.directory = None
        self.window_geometry = None

        if os.path.exists(self.config_file):
            self.config.read(self.config_file)
            self.load_config()

    def load_config(self):
        if self.config.has_option('DEFAULT', 'delimiter'):
            self.delimiter = self.config.get('DEFAULT', 'delimiter')
        else:
            self.delimiter = ','

        if self.config.has_option('DEFAULT', 'opendirectory'):
            self.directory = self.config.get('DEFAULT', 'opendirectory')

        if self.config.has_option('DEFAULT', 'window_geometry'):
            self.window_geometry = tuple(map(int, self.config.get('DEFAULT', 'window_geometry').split(',')))

    def save_config(self):
        self.config.set('DEFAULT', 'delimiter', self.delimiter)
        self.config.set('DEFAULT', 'opendirectory', self.directory or '')
        if self.window_geometry:
            self.config.set('DEFAULT', 'window_geometry', ','.join(map(str, self.window_geometry)))
        else:
            self.config.remove_option('DEFAULT', 'window_geometry')

        with open(self.config_file, 'w') as config_file:
            self.config.write(config_file)
        
    def set_delimiter(self, delimiter):
        self.delimiter = delimiter
        self.save_config()

    def set_directory(self, directory):
        self.directory = directory
        self.save_config()

    def get_delimiter(self):
        return self.delimiter

    def get_directory(self):
        return self.directory

    def set_window_geometry(self, geometry):
        self.window_geometry = geometry
        self.save_config()

    def get_window_geometry(self):
        return self.window_geometry