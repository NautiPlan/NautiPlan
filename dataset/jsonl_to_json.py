import json
import sys
from pathlib import Path

def jsonl_to_json(input_file, output_file=None):
    """
    将JSONL文件转换为JSON文件
    
    Args:
        input_file (str): 输入的JSONL文件路径
        output_file (str, optional): 输出的JSON文件路径，如果为None则自动生成
    """
    input_path = Path(input_file)
    
    # 检查输入文件是否存在
    if not input_path.exists():
        print(f"错误: 文件 {input_file} 不存在")
        return False
    
    # 如果没有指定输出文件，则自动生成
    if output_file is None:
        output_file = input_path.with_suffix('.json')
    
    try:
        # 读取JSONL文件并转换为JSON数组
        data = []
        with open(input_path, 'r', encoding='utf-8') as f:
            for line_num, line in enumerate(f, 1):
                line = line.strip()
                if line:  # 跳过空行
                    try:
                        json_obj = json.loads(line)
                        data.append(json_obj)
                    except json.JSONDecodeError as e:
                        print(f"警告: 第{line_num}行JSON格式错误: {e}")
                        continue
        
        # 写入JSON文件
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        print(f"转换成功!")
        print(f"输入文件: {input_file}")
        print(f"输出文件: {output_file}")
        print(f"共转换了 {len(data)} 条记录")
        return True
        
    except Exception as e:
        print(f"转换过程中发生错误: {e}")
        return False

def main():
    """主函数"""
    if len(sys.argv) < 2:
        print("用法: python jsonl_to_json.py <input_file.jsonl> [output_file.json]")
        print("示例: python jsonl_to_json.py dataset.jsonl")
        print("      python jsonl_to_json.py dataset.jsonl output.json")
        return
    
    input_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else None
    
    jsonl_to_json(input_file, output_file)

if __name__ == "__main__":
    main()
