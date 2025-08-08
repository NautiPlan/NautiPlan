import json
import sys
import os

def main():
    # 检查命令行参数
    if len(sys.argv) != 2:
        print("使用方法: python json_to_jsonl.py <输入文件名.json>")
        print("示例: python json_to_jsonl.py training_dataset_500.json")
        sys.exit(1)
    
    input_file = sys.argv[1]
    
    # 检查输入文件是否存在
    if not os.path.exists(input_file):
        print(f"错误: 文件 '{input_file}' 不存在")
        sys.exit(1)
    
    # 检查文件扩展名
    if not input_file.endswith('.json'):
        print("错误: 输入文件必须是 .json 格式")
        sys.exit(1)
    
    # 生成输出文件名
    output_file = input_file.replace('.json', '.jsonl')
    
    try:
        # 读取原始文件
        with open(input_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # 将数据转换为JSONL格式并写入新文件
        with open(output_file, 'w', encoding='utf-8') as f:
            for item in data:
                f.write(json.dumps(item, ensure_ascii=False) + '\n')
        
        print(f'转换完成！')
        print(f'输入文件: {input_file}')
        print(f'输出文件: {output_file}')
        print(f'共处理了 {len(data)} 条记录')
        
    except json.JSONDecodeError as e:
        print(f"错误: JSON文件格式不正确 - {e}")
        sys.exit(1)
    except Exception as e:
        print(f"错误: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
