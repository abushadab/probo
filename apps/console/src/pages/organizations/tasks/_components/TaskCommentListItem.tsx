// Copyright (c) 2026 Probo Inc <hello@probo.com>.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

import { TrashIcon, UserIcon } from "@phosphor-icons/react";
import { dateTimeFormat } from "@probo/i18n";
import { isRichEditorContentEmpty, RichEditor, richEditorContentTextLength } from "@probo/ui";
import { Avatar } from "@probo/ui/src/v2/Avatar/Avatar";
import { ErrorBoundary } from "@probo/ui/src/v2/ErrorBoundary/ErrorBoundary";
import { Field } from "@probo/ui/src/v2/form/Field";
import { IconButton } from "@probo/ui/src/v2/IconButton/IconButton";
import { Text } from "@probo/ui/src/v2/typography/Text";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { graphql, useFragment } from "react-relay";

import type { TaskCommentListItem_taskComment$key } from "#/__generated__/core/TaskCommentListItem_taskComment.graphql";

import { taskCommentMaxLength } from "../_lib/taskCommentMaxLength";
import { useDebouncedSerializedFieldSave } from "../_lib/useSerializedFieldSave";
import { useUpdateTaskComment } from "../_lib/useUpdateTaskComment";
import { taskCommentListItem } from "../variants";

import { TaskCommentDeleteDialog } from "./TaskCommentDeleteDialog";

const taskCommentSaveDelayMs = 1000;

const taskCommentListItemFragment = graphql`
  fragment TaskCommentListItem_taskComment on TaskComment {
    id
    content
    createdAt
    owner {
      fullName
    }
    canUpdate: permission(action: "core:task-comment:update")
    canDelete: permission(action: "core:task-comment:delete")
    ...TaskCommentDeleteDialog_taskComment
  }
`;

interface TaskCommentListItemProps {
  taskCommentKey: TaskCommentListItem_taskComment$key;
}

function TaskCommentEditor({
  commentId,
  saved,
}: {
  commentId: string;
  saved: string;
}) {
  const { t } = useTranslation("organizations/tasks");
  const [updateTaskComment] = useUpdateTaskComment();
  const [draft, setDraft] = useState(saved);
  const [savedContent, setSavedContent] = useState(saved);
  const [dirty, setDirty] = useState(false);
  const [editorGeneration, setEditorGeneration] = useState(0);
  const [error, setError] = useState<string | undefined>();

  if (saved !== savedContent) {
    setSavedContent(saved);
    if (!dirty) {
      setDraft(saved);
    }
  }

  const persist = useCallback(
    async (value: string) => {
      if (isRichEditorContentEmpty(value)) {
        setDraft((current) => {
          if (current !== value && !isRichEditorContentEmpty(current)) {
            return current;
          }

          setDirty(false);
          setEditorGeneration(generation => generation + 1);
          setError(t("detailsPage.comments.errors.contentRequired"));
          return saved;
        });
        return;
      }

      if (richEditorContentTextLength(value) > taskCommentMaxLength) {
        setError(
          t("detailsPage.comments.errors.contentTooLong", {
            max: taskCommentMaxLength,
          }),
        );
        return;
      }

      try {
        await updateTaskComment(
          {
            variables: {
              input: {
                taskCommentId: commentId,
                content: value,
              },
            },
          },
          { successMessage: false },
        );
        setDraft((current) => {
          if (current === value) {
            setDirty(false);
            setError(undefined);
            return value;
          }
          return current;
        });
      } catch {
        setDraft((current) => {
          if (current === value) {
            setDirty(false);
            setEditorGeneration(generation => generation + 1);
            return saved;
          }
          return current;
        });
      }
    },
    [commentId, saved, t, updateTaskComment],
  );
  const persistDebounced = useDebouncedSerializedFieldSave(
    persist,
    taskCommentSaveDelayMs,
  );
  const { editor } = taskCommentListItem();

  return (
    <Field error={error}>
      <RichEditor
        key={editorGeneration}
        className={editor()}
        variant="compact"
        content={draft}
        aria-label={t("detailsPage.comments.fields.description")}
        onChangeContent={(next) => {
          setDirty(true);
          setDraft(next);
          if (richEditorContentTextLength(next) > taskCommentMaxLength) {
            setError(
              t("detailsPage.comments.errors.contentTooLong", {
                max: taskCommentMaxLength,
              }),
            );
            return;
          }

          setError(undefined);
          persistDebounced.schedule(next);
        }}
        onBlur={() => {
          persistDebounced.flush();
        }}
      />
    </Field>
  );
}

export function TaskCommentListItem({ taskCommentKey }: TaskCommentListItemProps) {
  const { i18n, t } = useTranslation("organizations/tasks");
  const comment = useFragment(taskCommentListItemFragment, taskCommentKey);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { root, header, meta, content, editor } = taskCommentListItem();
  const ownerInitial = comment.owner.fullName.charAt(0).toUpperCase();

  return (
    <li className={root()}>
      <div className={header()}>
        <Avatar
          size={2}
          variant="soft"
          color="gold"
          radius="full"
          fallback={ownerInitial || <UserIcon />}
        />
        <div className={meta()}>
          <Text size={2} weight="medium">
            {comment.owner.fullName}
          </Text>
          <Text size={1} color="faint">
            {dateTimeFormat(i18n.language, comment.createdAt)}
          </Text>
        </div>
        {comment.canDelete && (
          <>
            <IconButton
              variant="ghost"
              color="neutral"
              aria-label={t("detailsPage.comments.actions.delete")}
              onClick={() => {
                setDeleteOpen(true);
              }}
            >
              <TrashIcon />
            </IconButton>
            <TaskCommentDeleteDialog
              taskCommentKey={comment}
              open={deleteOpen}
              onOpenChange={setDeleteOpen}
            />
          </>
        )}
      </div>
      <div className={content()}>
        <ErrorBoundary
          fallback={(
            <Text size={2} color="faint">
              {t("detailsPage.comments.errors.content")}
            </Text>
          )}
        >
          {comment.canUpdate
            ? (
                <TaskCommentEditor
                  commentId={comment.id}
                  saved={comment.content}
                />
              )
            : (
                <RichEditor
                  className={editor()}
                  variant="compact"
                  content={comment.content}
                  disabled
                />
              )}
        </ErrorBoundary>
      </div>
    </li>
  );
}
