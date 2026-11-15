const storageKey = "submission-drafts";
const drafts = JSON.parse(localStorage.getItem(storageKey) || "[]");

let role = "author";
let editingDraft = null;

const pageTitle = document.getElementById("page-title");
const formTitle = document.getElementById("form-title");
const draftForm = document.getElementById("draft-form");
const draftList = document.getElementById("draft-list");
const emptyMessage = document.getElementById("empty-message");
const cancelButton = document.getElementById("cancel-button");

const categoryInput = draftForm.elements.namedItem("category");
const titleInput = draftForm.elements.namedItem("title");
const contentInput = draftForm.elements.namedItem("content");

document.getElementById("author-button").addEventListener("click", () => {
    switchRole("author");
});

document.getElementById("editor-button").addEventListener("click", () => {
    switchRole("editor");
});

cancelButton.addEventListener("click", resetForm);

function switchRole(nextRole) {
    role = nextRole;
    resetForm();
    showList();
}

function resetForm() {
    editingDraft = null;
    draftForm.reset();
    formTitle.textContent = "新增稿件";
    cancelButton.hidden = true;
}

function saveAndRefresh() {
    localStorage.setItem(storageKey, JSON.stringify(drafts));
    showList();
}

// 作者只能修改、送審或刪除「編輯中」的稿件。
function canEdit(draft) {
    return role === "author"
        && drafts.includes(draft)
        && draft.status === "編輯中";
}

draftForm.addEventListener("submit", (event) => {
    event.preventDefault();

    if (role !== "author") {
        return;
    }

    const fields = {
        category: categoryInput.value.trim(),
        title: titleInput.value.trim(),
        content: contentInput.value.trim()
    };

    if (!fields.category || !fields.title || !fields.content) {
        alert("請填寫類別、標題和文章內容。");
        return;
    }

    if (editingDraft) {
        if (!canEdit(editingDraft)) {
            resetForm();
            return;
        }

        Object.assign(editingDraft, fields);
    } else {
        drafts.push({
            ...fields,
            author: "示範作者",
            status: "編輯中"
        });
    }

    resetForm();
    saveAndRefresh();
});

function editDraft(draft) {
    if (!canEdit(draft)) {
        return;
    }

    editingDraft = draft;
    categoryInput.value = draft.category;
    titleInput.value = draft.title;
    contentInput.value = draft.content;
    formTitle.textContent = "修改稿件";
    cancelButton.hidden = false;
    titleInput.focus();
}

function deleteDraft(draft) {
    if (!canEdit(draft)) {
        return;
    }

    if (!confirm("確定刪除這篇草稿？")) {
        return;
    }

    if (editingDraft === draft) {
        resetForm();
    }

    drafts.splice(drafts.indexOf(draft), 1);
    saveAndRefresh();
}

function submitDraft(draft) {
    if (!canEdit(draft)) {
        return;
    }

    if (editingDraft === draft) {
        resetForm();
    }

    draft.status = "審查中";
    saveAndRefresh();
}

function reviewDraft(draft, nextStatus) {
    if (role !== "editor" || !drafts.includes(draft) || draft.status !== "審查中") {
        return;
    }

    draft.status = nextStatus;
    saveAndRefresh();
}

function addButton(parent, label, onClick) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.addEventListener("click", onClick);
    parent.append(" ", button);
}

function showList() {
    const isAuthor = role === "author";

    pageTitle.textContent = isAuthor ? "投稿清單" : "待審查清單";
    draftForm.hidden = !isAuthor;
    draftList.replaceChildren();

    const visibleDrafts = isAuthor
        ? drafts
        : drafts.filter(draft => draft.status === "審查中");

    emptyMessage.textContent = isAuthor ? "目前沒有稿件。" : "目前沒有待審稿件。";
    emptyMessage.hidden = visibleDrafts.length > 0;

    for (const draft of visibleDrafts) {
        const item = document.createElement("li");

        if (isAuthor) {
            item.textContent = `${draft.category}｜${draft.title}｜${draft.status}`;

            if (canEdit(draft)) {
                addButton(item, "修改", () => editDraft(draft));
                addButton(item, "送審", () => submitDraft(draft));
                addButton(item, "刪除", () => deleteDraft(draft));
            }
        } else {
            const author = draft.author || "示範作者";
            item.textContent = `${author}｜${draft.category}｜${draft.title}`;

            const details = document.createElement("details");
            const summary = document.createElement("summary");
            const content = document.createElement("p");

            summary.textContent = "查看全文";
            content.textContent = draft.content;
            details.append(summary, content);

            addButton(details, "通過", () => reviewDraft(draft, "已通過"));
            addButton(details, "退回", () => reviewDraft(draft, "編輯中"));
            item.append(details);
        }

        draftList.append(item);
    }
}

showList();