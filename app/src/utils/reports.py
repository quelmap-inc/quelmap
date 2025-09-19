import os

def save_report(model, query, report, code_result):
    """マークダウン形式のレポートを保存する"""
    # Ensure the exports directory exists
    exports_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "exports", "good")
    if code_result == "code-error":
        exports_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "exports", "codeerror")

    # タグの正常性 (<think>, </think>, <python>, </python>, <report>, </report>)の個数がそれぞれ１つずつであることを確認
    tag_error = False
    if report.count("<think>") > 1 or report.count("</think>") > 1:
        tag_error = True
        print("Error: <think> and </think> tags are not balanced.")
    if report.count("<python>") > 1 or report.count("</python>") > 1:
        tag_error = True
        print("Error: <python> and </python> tags are not balanced.")
    if report.count("<report>") > 1 or report.count("</report>") > 1:
        tag_error = True
        print("Error: <report> and </report> tags are not balanced.")
    if tag_error:
        print("Error: Tags are not balanced.")
        exports_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "exports", "tagerror")

    os.makedirs(exports_dir, exist_ok=True)
    
    # Create a safe filename using the first 30 chars of the query
    safe_query = "".join([c if c.isalnum() else "_" for c in query[:30]])
    filename = f"{safe_query}-{model}.md".replace("/", "_")
    file_path = os.path.join(exports_dir, filename)
    
    # Save the report
    try:
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(f"{query}\n\n{report}")
        print(f"Report saved to {file_path}")
        return {"status": "success", "path": file_path}
    except Exception as e:
        print(f"Failed to save report: {e}")
        return {"status": "error", "message": str(e)}
