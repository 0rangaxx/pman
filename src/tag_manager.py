## tag_manager.py
from typing import List
import re

class TagManager:
    """
    TagManagerは、画像のメタデータやファイル名からタグを抽出する役割を持ちます。
    この実装では、大文字と小文字を区別せず、英数字以外の文字を無視して、正規表現を使用して画像のファイル名やメタデータからタグを抽出できると仮定しています。
    """

    def __init__(self):
        # 英数字のみを含むタグ抽出用の正規表現パターン
        self.tag_pattern = r'\b\w+\b'
        print("TagManagerが初期化されました。")

    def extract_tags(self, image_data: str) -> List[str]:
        """
        正規表現を使用して、大文字と小文字を区別せずに、指定された画像データからタグを抽出します。
        パラメータ:
        - image_data: str - タグを抽出する画像のメタデータまたはファイル名を含む文字列。
        返り値:
        - List[str]: 抽出されたタグのリスト。
        """
        print(f"画像データ: {image_data}")
        tags = re.findall(self.tag_pattern, image_data, re.IGNORECASE)
        print(f"抽出されたタグ: {tags}")
        
        # 一意性を確保しつつ、順序を保持する
        cleaned_tags = []
        for tag in tags:
            if tag not in cleaned_tags:
                cleaned_tags.append(tag)
        
        print(f"重複を除去したタグ: {cleaned_tags}")
        return cleaned_tags

# 使用例
if __name__ == "__main__":
    tag_manager = TagManager()
    example_image_data = "sunset_beach_2023.jpg"
    print(f"例の画像データ: {example_image_data}")
    extracted_tags = tag_manager.extract_tags(example_image_data)
    print(f"抽出されたタグ: {extracted_tags}")