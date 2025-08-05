# 数据库架构规划 (Supabase)

**版本**: 1.1

## 1. 文档修订记录

| 版本  | 日期       | 修订人 | 修订说明                 |
| :---- | :--------- | :----- | :----------------------- |
| 1.0   | 2025-08-05 | Gemini | 基于项目原型创建         |
| 1.1   | 2025-08-05 | Gemini | 新增“阵营” (faction) 字段 |

## 2. 用户与认证

### `profiles` (公开)

| 字段名   | 类型                | 描述                                     | 备注                       |
|----------|---------------------|------------------------------------------|----------------------------|
| `id`     | `uuid` (主键)       | 用户ID，与 `auth.users.id` 关联。        | `references auth.users on delete cascade` |
| `role`   | `text`              | 用户角色（例如：'user', 'admin'）。      | 默认为 'user'。            |
| `faction`| `text`              | **[新增]** 用户选择的阵营。例如 'tianming' 或 'nishang'。 | 可为 NULL，新用户默认为空。 |
| `updated_at` | `timestamp with time zone` | 最后更新时间。                           | 自动更新。                 |

... (其余内容保持不变) ...
sql架构代码
-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.blocks (
  pdf_url text,
  document_url text,
  section_id uuid NOT NULL,
  title text NOT NULL,
  content_markdown text,
  video_url text,
  quiz_question text,
  quiz_options ARRAY,
  correct_answer_index integer,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  ppt_url text,
  CONSTRAINT blocks_pkey PRIMARY KEY (id),
  CONSTRAINT blocks_section_id_fkey FOREIGN KEY (section_id) REFERENCES public.sections(id)
);
CREATE TABLE public.categories (
  title text NOT NULL,
  description text,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT categories_pkey PRIMARY KEY (id)
);
CREATE TABLE public.chapters (
  category_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  image_url text,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT chapters_pkey PRIMARY KEY (id),
  CONSTRAINT chapters_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id)
);
CREATE TABLE public.profiles (
  faction text,
  id uuid NOT NULL,
  role text DEFAULT 'user'::text,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.scores (
  user_id uuid NOT NULL UNIQUE,
  username text NOT NULL UNIQUE,
  points integer NOT NULL DEFAULT 0,
  CONSTRAINT scores_pkey PRIMARY KEY (user_id),
  CONSTRAINT scores_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.sections (
  chapter_id uuid NOT NULL,
  title text NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT sections_pkey PRIMARY KEY (id),
  CONSTRAINT sections_chapter_id_fkey FOREIGN KEY (chapter_id) REFERENCES public.chapters(id)
);
CREATE TABLE public.user_progress (
  completed_blocks ARRAY,
  awarded_points_blocks ARRAY,
  user_id uuid NOT NULL,
  completed_sections jsonb DEFAULT '[]'::jsonb,
  updated_at timestamp with time zone DEFAULT now(),
  awarded_points_sections jsonb DEFAULT '[]'::jsonb,
  CONSTRAINT user_progress_pkey PRIMARY KEY (user_id),
  CONSTRAINT user_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);