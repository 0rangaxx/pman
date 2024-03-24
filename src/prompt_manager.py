## prompt_manager.py
from typing import List, Dict
import sqlite3
import os
from database_manager import DatabaseManager

class PromptManager:
    def __init__(self, database_path: str = "prompts.db"):
        self.database_manager = DatabaseManager(database_path)

    def register_prompt(self, prompt: Dict) -> bool:
        try:
            if prompt['image_data'] is not None:
                print(f"Registering prompt with image data length: {len(prompt['image_data'])}")
            else:
                print("Registering prompt without image data")
                # noimage.pngを読み込んでimage_dataに設定
                noimage_path = os.path.join(os.path.dirname(__file__), 'noimage.png')
                with open(noimage_path, 'rb') as file:
                    prompt['image_data'] = file.read()
            query = "INSERT INTO prompts (title, prompt, description, tags, image_data) VALUES (?, ?, ?, ?, ?)"
            parameters = (prompt["title"], prompt["prompt"], prompt["description"], ",".join(prompt["tags"]), prompt["image_data"])
            result = self.database_manager.execute_query(query, parameters)
            return result > 0
        except sqlite3.Error as e:
            print(f"Database error while registering prompt: {e}")
            return False
        except Exception as e:
            print(f"Unexpected error while registering prompt: {e}")
            return False

    def edit_prompt(self, prompt_id: int, new_details: Dict) -> bool:
        try:
            if new_details['image_data'] is not None:
                print(f"Editing prompt with image data length: {len(new_details['image_data'])}")
            else:
                print("Editing prompt without image data")
                # noimage.pngを読み込んでimage_dataに設定
                noimage_path = os.path.join(os.path.dirname(__file__), 'noimage.png')
                with open(noimage_path, 'rb') as file:
                    new_details['image_data'] = file.read()
            query = "UPDATE prompts SET title = ?, prompt = ?, description = ?, tags = ?, image_data = ? WHERE id = ?"
            parameters = (new_details["title"], new_details["prompt"], new_details["description"], ",".join(new_details["tags"]), new_details["image_data"], prompt_id)
            self.database_manager.execute_query(query, parameters)
            return True
        except sqlite3.Error as e:
            print(f"Database error while editing prompt: {e}")
            return False
        except Exception as e:
            print(f"Unexpected error while editing prompt: {e}")
            return False
        
    def delete_prompt(self, prompt_id: int) -> bool:
        try:
            query = "DELETE FROM prompts WHERE id = ?"
            parameters = (prompt_id,)
            self.database_manager.execute_query(query, parameters)
            return True
        except sqlite3.Error as e:
            print(f"Database error while deleting prompt: {e}")
            return False
        except Exception as e:
            print(f"Unexpected error while deleting prompt: {e}")
            return False
    
    def copy_prompt(self, prompt_id: int) -> bool:
        """
        Creates a copy of an existing prompt.
        
        :param prompt_id: The ID of the prompt to copy.
        :return: A boolean indicating the success of the operation.
        """
        try:
            query = "INSERT INTO prompts (title, prompt, description, tags, image_data) SELECT title, prompt, description, tags, image_data FROM prompts WHERE id = ?"
            parameters = (prompt_id,)
            result = self.database_manager.execute_query(query, parameters)
            return result > 0
        except sqlite3.Error as e:
            print(f"Database error while copying prompt: {e}")
            return False
        except Exception as e:
            print(f"Unexpected error while copying prompt: {e}")
            return False

    def get_prompts(self) -> List[Dict]:
        try:
            query = "SELECT id, title, prompt, description, tags, image_data FROM prompts"
            prompts = self.database_manager.fetch_all(query)
            return [{"id": prompt[0], "title": prompt[1], "prompt": prompt[2], "description": prompt[3], "tags": prompt[4].split(",") if prompt[4] else [], "image_data": prompt[5]} for prompt in prompts]
        except sqlite3.Error as e:
            print(f"Database error while retrieving prompts: {e}")
            return []
        except Exception as e:
            print(f"Unexpected error while retrieving prompts: {e}")
            return []

    def get_prompt_details(self, prompt_id: int) -> Dict:
        try:
            query = "SELECT id, title, prompt, description, tags, image_data FROM prompts WHERE id = ?"
            parameters = (prompt_id,)
            result = self.database_manager.fetch_one(query, parameters)
            if result:
                return {
                    "id": result[0],
                    "title": result[1],
                    "prompt": result[2],
                    "description": result[3],
                    "tags": result[4].split(",") if result[4] else [],
                    "image_data": result[5]
                }
            else:
                return {}
        except sqlite3.Error as e:
            print(f"Database error while retrieving prompt details: {e}")
            return {}
        except Exception as e:
            print(f"Unexpected error while retrieving prompt details: {e}")
            return {}

    def get_all_tags(self) -> List[str]:
        """
        Retrieves all unique tags from the prompts.
        
        :return: A list of unique tags.
        """
        try:
            prompts = self.get_prompts()
            all_tags = set()
            for prompt in prompts:
                all_tags.update(prompt['tags'])
            return list(all_tags)
        except Exception as e:
            print(f"Unexpected error while retrieving all tags: {e}")
            return []