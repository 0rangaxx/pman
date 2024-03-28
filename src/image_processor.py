## image_processor.py
from PIL import Image
import os
import json
import re
import io 
from typing import List, Tuple

# 実際のライブラリのインポートのプレースホルダーとします
# from content_moderation_api import check_content_safety
# from image_recognition_library import get_image_tags

class ImageProcessor:
    def __init__(self, image_path: str = "", thumbnail_size: tuple = (128, 128)):
        """
        デフォルトの画像パスとサムネイルサイズでImageProcessorを初期化します。
        :param image_path: 画像ファイルのパス。
        :param thumbnail_size: サムネイルのサイズを示すタプル。
        """
        self.image_path = image_path
        self.thumbnail_size = thumbnail_size
        print(f"ImageProcessorを初期化 - 画像パス: {image_path}, サムネイルサイズ: {thumbnail_size}")

    def generate_thumbnail(self, image_path: str, size: Tuple[int, int] = None) -> bytes:
        """
        image_pathで指定された画像のサムネイルを生成します。
        :param image_path: 画像ファイルのパス。
        :param size: サムネイルのサイズを示すタプル。デフォルトはNone。
        :return: 生成されたサムネイル画像のパス。
        """
        if not os.path.exists(image_path):
            raise FileNotFoundError(f"指定された画像パスが存在しません: {image_path}")

        try:
            print(f"画像を開いています: {image_path}")
            with Image.open(image_path) as img:
                if size is None:
                    size = self.thumbnail_size
                print(f"サムネイルを生成中 - サイズ: {size}")
                img.thumbnail(size)
            
                # 画像がRGBAモードの場合、RGBモードに変換
                if img.mode == "RGBA":
                    img = img.convert("RGB")
                with io.BytesIO() as output:
                    img.save(output, format="JPEG")
                    thumbnail_data = output.getvalue()
            return thumbnail_data
        except IOError as e:
            raise IOError(f"画像の開閉または保存に失敗しました: {str(e)}")

    def _get_thumbnail_path(self, image_path: str) -> str:
        """
        元の画像パスに基づいてサムネイルを保存するためのパスを生成します。
        :param image_path: 元の画像ファイルのパス。
        :return: サムネイル画像のパス。
        """
        directory, filename = os.path.split(image_path)
        filename_without_ext, _ = os.path.splitext(filename)
        thumbnail_filename = f"{filename_without_ext}_thumbnail.jpg"
        thumbnail_path = os.path.join(directory, thumbnail_filename)
        print(f"生成されたサムネイルのパス: {thumbnail_path}")
        return thumbnail_path
    
    def get_png_info(self, image_path: str):
        signature = b"\x89PNG\r\n\x1a\n"
        crc_size = 4
        
        with open(image_path, "rb") as file:
            real_sig = file.read(len(signature))
            if real_sig != signature:
                return ""
            
            while True:
                chunk_data = file.read(8)
                if len(chunk_data) != 8:
                    break
                
                length = int.from_bytes(chunk_data[:4], byteorder='big')
                chunk_type = chunk_data[4:].decode('ascii')
                
                if chunk_type == "tEXt":
                    s = file.read(length)
                    if s.startswith(b"parameters"):
                        s = s[10:]
                        if len(s) > 0 and s[0] == 0:
                            while len(s) > 0 and s[0] == 0:
                                s = s[1:]
                            return s.decode('latin1')
                
                elif chunk_type == "iTXt":
                    s = file.read(length)
                    if s.startswith(b"parameters"):
                        s = s[10:]
                        if len(s) > 0 and s[0] == 0:
                            while len(s) > 0 and s[0] == 0:
                                s = s[1:]
                            return s.decode('utf-8')
                
                else:
                    file.seek(length, 1)
                
                file.seek(crc_size, 1)
        
        return ""

    def get_png_info_json(self, image_path: str):
        info_string = self.get_png_info(image_path)
        lines = info_string.split("\n")
        phase = 0
        prompt = ""
        neg_prompt = ""
        data = {}
        
        for line in lines:
            pair_regex = re.compile(r"(?P<pair>[A-Z][a-zA-Z0-9 ]*: [^,]+)(, )?")
            
            if phase == 0:
                if line.startswith("Negative prompt: "):
                    neg_prompt = line[17:]
                    phase = 1
                    continue
                
                match = pair_regex.match(line)
                if match:
                    phase = 2
                else:
                    prompt += "\n" + line
                    continue
            
            if phase == 1:
                match = pair_regex.match(line)
                if not match:
                    neg_prompt += "\n" + line
                    continue
                
                phase = 2
            
            pairs = pair_regex.findall(line)
            for pair in pairs:
                name, value = pair[0].split(": ")
                data[name] = value
        
        data["Prompt"] = prompt.strip()
        data["Negative prompt"] = neg_prompt.strip()
        
        return json.dumps(data)

    @staticmethod
    def extract_tags(self, image_path: str) -> List[str]:
        """
        コンテンツまたはメタデータに基づいて画像からタグを抽出します。
        :param image_path: 画像ファイルのパス。
        :return: 画像から抽出されたタグのリスト。
        """
        print(f"画像のタグを抽出中: {image_path}")
        return self.get_png_info_json(image_path)

# 使用例
if __name__ == "__main__":
    import sys
    
    if len(sys.argv) != 2:
        print("Usage: python script.py <file_name>")
        sys.exit(1)
    
    file_name = sys.argv[1]
    processor = ImageProcessor(file_name)
    result = processor.get_png_info(file_name)
    print(result)
    
    json_result = processor.get_png_info_json(file_name)
    print(json_result)
    try:
        thumbnail_path = processor.generate_thumbnail()
        print(f"サムネイルが生成されました: {thumbnail_path}")
        tags = ImageProcessor.extract_tags("path/to/your/image.jpg")
        print(f"抽出されたタグ: {tags}")
    except Exception as e:
        print(f"画像の処理中にエラーが発生しました: {e}")