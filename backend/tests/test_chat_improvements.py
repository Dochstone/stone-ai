"""Tests for chat improvements (March 24, 2026).

Covers:
1. Backend: PATCH /api/chats/{id} rename endpoint
2. Frontend: comparison mode, drag & drop, thinking indicator, keyboard shortcuts, streaming cursor
3. Nav: mobile menu compact layout, solid bg, close button
4. Dark mode: no hardcoded bg-white in WebChat
"""

from pathlib import Path

ROOT = Path(__file__).parent.parent.parent
WEBCHAT = ROOT / "website" / "components" / "WebChat.tsx"
NAV = ROOT / "website" / "components" / "Nav.tsx"
CHATS_ROUTER = Path(__file__).parent.parent / "app" / "routers" / "chats.py"


def _webchat():
    return WEBCHAT.read_text(encoding="utf-8")


def _nav():
    return NAV.read_text(encoding="utf-8")


def _chats():
    return CHATS_ROUTER.read_text(encoding="utf-8")


# ═══════════════════════════════════════════════════════════
# 1. Backend: PATCH rename endpoint
# ═══════════════════════════════════════════════════════════

def test_chats_router_has_patch_rename():
    """chats.py should have a PATCH endpoint for renaming sessions."""
    src = _chats()
    assert '@router.patch("/{session_id}")' in src


def test_chats_rename_request_model():
    """Should have RenameSessionRequest with title field."""
    src = _chats()
    assert "class RenameSessionRequest" in src
    assert "title: str" in src


def test_chats_rename_updates_title():
    """PATCH endpoint should update session.title."""
    src = _chats()
    assert "session.title = body.title" in src


# ═══════════════════════════════════════════════════════════
# 2. Frontend: Comparison mode
# ═══════════════════════════════════════════════════════════

def test_compare_mode_state():
    """WebChat should have compare mode state variables."""
    src = _webchat()
    assert "compareMode" in src
    assert "compareModels" in src
    assert "compareStreaming" in src
    assert "compareResponses" in src


def test_compare_sends_parallel_requests():
    """sendCompareMessage should fire parallel fetch calls."""
    src = _webchat()
    assert "sendCompareMessage" in src
    assert "Promise.allSettled(promises)" in src


def test_compare_model_chips():
    """Compare mode should show selected model chips."""
    src = _webchat()
    assert "Сравнение:" in src
    assert "Добавить" in src


def test_compare_desktop_grid():
    """Desktop comparison uses CSS grid columns."""
    src = _webchat()
    assert "gridTemplateColumns" in src
    assert "repeat(" in src


def test_compare_mobile_tabs():
    """Mobile comparison uses tab-based view."""
    src = _webchat()
    assert "compareActiveTab" in src
    assert "md:hidden" in src


def test_compare_continue_button():
    """Each compare response has a 'Продолжить' button."""
    src = _webchat()
    assert "exitCompareWithModel" in src
    assert "Продолжить" in src


def test_compare_stop_all():
    """Stop button aborts all parallel requests."""
    src = _webchat()
    assert "stopCompare" in src
    assert "compareAbortRefs" in src


def test_compare_min_models_guard():
    """Cannot remove last model from comparison."""
    src = _webchat()
    assert "compareModels.length > 1" in src


def test_compare_max_3_models():
    """Cannot add more than 3 models."""
    src = _webchat()
    assert "compareModels.length < 3" in src


def test_compare_multi_select_checkbox():
    """Model picker shows checkboxes in compare mode."""
    src = _webchat()
    assert 'compareModels.includes(m.id)' in src


# ═══════════════════════════════════════════════════════════
# 3. Frontend: Drag & drop
# ═══════════════════════════════════════════════════════════

def test_drag_drop_handlers():
    """WebChat should have drag & drop event handlers."""
    src = _webchat()
    assert "onDragEnter" in src
    assert "onDragOver" in src
    assert "onDragLeave" in src
    assert "onDrop" in src


def test_drag_drop_overlay():
    """Should show visual overlay when dragging."""
    src = _webchat()
    assert "dragging" in src
    assert "Перетащите файл сюда" in src


def test_drag_counter():
    """Uses drag counter to handle nested elements."""
    src = _webchat()
    assert "dragCounterRef" in src


# ═══════════════════════════════════════════════════════════
# 4. Frontend: Thinking indicator
# ═══════════════════════════════════════════════════════════

def test_thinking_block_component():
    """ThinkingBlock component should exist."""
    src = _webchat()
    assert "function ThinkingBlock" in src
    assert "Ход мыслей" in src


def test_thinking_detects_think_tags():
    """MessageContent should parse <think>...</think> blocks."""
    src = _webchat()
    assert "<think>" in src
    assert "</think>" in src
    assert "thinkMatch" in src


def test_thinking_still_thinking_state():
    """Should show 'Размышляет...' during ongoing thinking."""
    src = _webchat()
    assert "isStillThinking" in src
    assert "Размышляет..." in src


# ═══════════════════════════════════════════════════════════
# 5. Frontend: Streaming cursor
# ═══════════════════════════════════════════════════════════

def test_streaming_cursor_css():
    """Streaming cursor animation CSS should exist."""
    src = _webchat()
    assert "streaming-cursor" in src
    assert "@keyframes blink" in src


def test_streaming_cursor_applied_to_last_message():
    """Cursor class applied only to last streaming message."""
    src = _webchat()
    assert 'streaming && i === messages.length - 1 && msg.role === "assistant"' in src


# ═══════════════════════════════════════════════════════════
# 6. Frontend: Keyboard shortcuts
# ═══════════════════════════════════════════════════════════

def test_keyboard_shortcut_new_chat():
    """Ctrl+N should create new chat."""
    src = _webchat()
    assert '"n"' in src
    assert "newChat()" in src


def test_keyboard_shortcut_focus_input():
    """Ctrl+/ should focus input."""
    src = _webchat()
    assert '"/"' in src
    assert "textareaRef.current?.focus()" in src


def test_keyboard_shortcut_toggle_sidebar():
    """Ctrl+Shift+S should toggle sidebar."""
    src = _webchat()
    assert '"S"' in src
    assert "toggleSidebar()" in src


# ═══════════════════════════════════════════════════════════
# 7. Frontend: Inline rename
# ═══════════════════════════════════════════════════════════

def test_sidebar_rename_prop():
    """Sidebar should accept onRenameSession prop."""
    src = _webchat()
    assert "onRenameSession" in src


def test_sidebar_rename_double_click():
    """Double-click should trigger inline edit."""
    src = _webchat()
    assert "onDoubleClick" in src
    assert "editingId" in src
    assert "editTitle" in src


def test_rename_session_api_call():
    """renameSession should PATCH the API."""
    src = _webchat()
    assert "renameSession" in src
    assert 'method: "PATCH"' in src


# ═══════════════════════════════════════════════════════════
# 8. Dark mode: no hardcoded bg-white
# ═══════════════════════════════════════════════════════════

def test_no_hardcoded_bg_white_in_webchat():
    """WebChat should not have plain 'bg-white' (use bg-bg instead).

    Exceptions: bg-white/20 (on accent bg for user messages) is OK.
    """
    src = _webchat()
    lines = src.split("\n")
    violations = []
    for i, line in enumerate(lines, 1):
        # Skip lines that are bg-white/NN (opacity variants on dark surfaces)
        if "bg-white" in line and "bg-white/" not in line:
            # Allow inside inline CSS strings (code blocks etc)
            if "code-block" in line or ".code-" in line:
                continue
            violations.append(f"Line {i}: {line.strip()[:80]}")
    assert not violations, f"Found hardcoded bg-white:\n" + "\n".join(violations)


# ═══════════════════════════════════════════════════════════
# 9. Nav: mobile menu fixes
# ═══════════════════════════════════════════════════════════

def test_nav_solid_bg_when_menu_open():
    """Nav should use solid bg-bg (not transparent) when menu is open."""
    src = _nav()
    assert 'menuOpen ? "bg-bg' in src


def test_nav_menu_solid_bg():
    """Mobile menu panel should have solid bg-bg (no transparency)."""
    src = _nav()
    # The mobile menu div should NOT have bg-bg/95 or backdrop-blur
    assert "bg-bg/95" not in src
    assert 'md:hidden bg-bg border-t' in src


def test_nav_burger_shrink0():
    """Burger button should have shrink-0 to prevent clipping."""
    src = _nav()
    assert "w-11 h-11 shrink-0" in src


def test_nav_tools_collapsed():
    """Mobile menu should have collapsible 'Ещё инструменты' section."""
    src = _nav()
    assert "Ещё инструменты" in src
    assert "tools.slice(0, 3)" in src
    assert "tools.slice(3)" in src


def test_nav_no_duplicate_pricing_links():
    """Mobile menu should not have both Цены and Тарифы."""
    src = _nav()
    # Count occurrences of /pricing links in mobile menu area
    mobile_section = src[src.index("Mobile menu"):]
    pricing_count = mobile_section.count('href="/pricing"')
    assert pricing_count == 1, f"Found {pricing_count} /pricing links, expected 1"


def test_nav_dropdown_bg_bg():
    """Desktop tools dropdown should use bg-bg not bg-white."""
    src = _nav()
    assert 'bg-bg rounded-xl shadow-lg' in src
