import os
import re
import requests
from typing import Dict, List, Optional
from bs4 import BeautifulSoup


def clean_html_content(html_content: str) -> str:
    """
    清理 HTML 内容，移除脚本、样式和多余空白

    Args:
        html_content: HTML 内容

    Returns:
        清理后的 HTML
    """
    if not html_content:
        return ""

    soup = BeautifulSoup(html_content, 'html.parser')

    # 移除 script 和 style 标签
    for script in soup(['script', 'style']):
        script.decompose()

    # 获取清理后的 HTML
    cleaned_html = str(soup)

    # 移除多余的空白行
    cleaned_html = re.sub(r'\n\s*\n', '\n\n', cleaned_html)

    return cleaned_html.strip()


def split_content_into_chunks(content: str, max_chunk_size: int = 3000) -> List[str]:
    """
    将长文本分割成多个块，按段落分割以保持语义完整性

    Args:
        content: 要分割的内容
        max_chunk_size: 每个块的最大字符数

    Returns:
        文本块列表
    """
    if not content or len(content) <= max_chunk_size:
        return [content] if content else []

    # 按段落分割（双换行或 HTML 段落标签）
    paragraphs = re.split(r'\n\n+|</p>|<br\s*/?>|<div>', content)

    chunks = []
    current_chunk = ""

    for paragraph in paragraphs:
        paragraph = paragraph.strip()
        if not paragraph:
            continue

        # 如果当前段落加上现有chunk超过限制
        if len(current_chunk) + len(paragraph) > max_chunk_size:
            if current_chunk:
                chunks.append(current_chunk)
                current_chunk = paragraph
            else:
                # 单个段落就超过限制，强制分割
                chunks.append(paragraph[:max_chunk_size])
                current_chunk = paragraph[max_chunk_size:]
        else:
            current_chunk += ("\n\n" if current_chunk else "") + paragraph

    if current_chunk:
        chunks.append(current_chunk)

    return chunks


def translate_chunk(chunk: str, source_lang: str, target_lang: str) -> str:
    """
    翻译单个文本块

    Args:
        chunk: 要翻译的文本块
        source_lang: 源语言 ('zh', 'en', 'ja')
        target_lang: 目标语言 ('zh', 'en', 'ja')

    Returns:
        翻译后的文本
    """
    if not chunk or source_lang == target_lang:
        return chunk

    # 语言映射
    lang_map = {
        'zh': 'Chinese',
        'en': 'English',
        'ja': 'Japanese',
    }

    source_language = lang_map.get(source_lang, 'Chinese')
    target_language = lang_map.get(target_lang, 'English')

    api_key = os.getenv('DEEPSEEK_API_KEY')
    if not api_key:
        print("[WARNING] DEEPSEEK_API_KEY not found, returning original text")
        return chunk

    api_url = "https://api.deepseek.com/chat/completions"

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    }

    # 检测内容是否包含 HTML
    is_html = bool(re.search(r'<[^>]+>', chunk))

    if is_html:
        prompt = f"""Translate the following HTML content from {source_language} to {target_language}.
IMPORTANT: 
- Keep all HTML tags unchanged
- Only translate the text content between tags
- Preserve the HTML structure exactly
- Do not add any explanations or additional text

HTML to translate:
{chunk}"""
    else:
        prompt = f"""Translate the following text from {source_language} to {target_language}.
Only return the translated text, without any explanations or additional information.

Text to translate:
{chunk}"""

    payload = {
        "model": "deepseek-chat",
        "messages": [
            {
                "role": "system",
                "content": "You are a professional translator. Translate accurately and naturally while preserving the original format."
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        "temperature": 0.3,
        "max_tokens": 4000,
    }

    try:
        response = requests.post(
            api_url, headers=headers, json=payload, timeout=60)
        response.raise_for_status()

        result = response.json()
        translated_text = result['choices'][0]['message']['content'].strip()

        # 移除可能的 markdown 代码块标记
        translated_text = re.sub(r'^```html?\s*\n', '', translated_text)
        translated_text = re.sub(r'\n```$', '', translated_text)

        print(
            f"[INFO] Chunk translation successful: {source_lang} -> {target_lang}")
        return translated_text

    except requests.exceptions.RequestException as e:
        print(f"[ERROR] Translation failed: {str(e)}")
        return chunk
    except (KeyError, IndexError) as e:
        print(f"[ERROR] Failed to parse translation response: {str(e)}")
        return chunk


def translate_text(text: str, source_lang: str, target_lang: str, is_html: bool = False, max_chunk_size: int = 3000) -> str:
    """
    翻译文本，支持长文本分块翻译

    Args:
        text: 要翻译的文本
        source_lang: 源语言 ('zh', 'en', 'ja')
        target_lang: 目标语言 ('zh', 'en', 'ja')
        is_html: 是否为 HTML 内容
        max_chunk_size: 每个块的最大字符数

    Returns:
        翻译后的文本
    """
    if not text or source_lang == target_lang:
        return text

    # 清理 HTML（如果是 HTML 内容）
    if is_html:
        text = clean_html_content(text)

    # 检查是否需要分块
    if len(text) <= max_chunk_size:
        return translate_chunk(text, source_lang, target_lang)

    # 分块翻译
    print(
        f"[INFO] Text length {len(text)} exceeds limit, splitting into chunks...")
    chunks = split_content_into_chunks(text, max_chunk_size)
    print(f"[INFO] Split into {len(chunks)} chunks")

    translated_chunks = []
    for i, chunk in enumerate(chunks, 1):
        print(f"[INFO] Translating chunk {i}/{len(chunks)}...")
        translated_chunk = translate_chunk(chunk, source_lang, target_lang)
        translated_chunks.append(translated_chunk)

    # 合并翻译结果
    if is_html:
        # HTML 内容直接连接
        return ''.join(translated_chunks)
    else:
        # 普通文本用双换行连接
        return '\n\n'.join(translated_chunks)


def translate_dict(data: Dict, source_lang: str, target_lang: str, keys_to_translate: list) -> Dict:
    """
    翻译字典中的指定键

    Args:
        data: 要翻译的字典
        source_lang: 源语言
        target_lang: 目标语言
        keys_to_translate: 需要翻译的键列表

    Returns:
        翻译后的字典
    """
    translated_data = data.copy()

    for key in keys_to_translate:
        if key in data and data[key]:
            # 检测是否为 HTML 内容
            is_html = bool(re.search(r'<[^>]+>', str(data[key])))
            translated_data[key] = translate_text(
                data[key],
                source_lang,
                target_lang,
                is_html=is_html
            )

    return translated_data


def translate_project_content(content: str, source_lang: str, target_lang: str) -> str:
    """
    翻译项目内容（可能包含 HTML 或 Markdown）

    Args:
        content: 要翻译的内容
        source_lang: 源语言
        target_lang: 目标语言

    Returns:
        翻译后的内容
    """
    if not content or source_lang == target_lang:
        return content

    # 检测是否为 HTML
    is_html = bool(re.search(r'<[^>]+>', content))

    return translate_text(
        content,
        source_lang,
        target_lang,
        is_html=is_html,
        max_chunk_size=3000
    )


def batch_translate_texts(texts: List[str], source_lang: str, target_lang: str) -> List[str]:
    """
    批量翻译多个文本

    Args:
        texts: 要翻译的文本列表
        source_lang: 源语言
        target_lang: 目标语言

    Returns:
        翻译后的文本列表
    """
    if not texts or source_lang == target_lang:
        return texts

    translated_texts = []
    for i, text in enumerate(texts, 1):
        print(f"[INFO] Translating text {i}/{len(texts)}...")
        translated_text = translate_text(text, source_lang, target_lang)
        translated_texts.append(translated_text)

    return translated_texts
