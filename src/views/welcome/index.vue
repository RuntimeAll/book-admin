<template>
  <div class="welcome-container">
    <div class="welcome-header">
      <h1>欢迎使用 misikt 管理后台</h1>
      <p class="welcome-sub">题库 · 系统管理</p>
    </div>
    <el-row :gutter="24" class="card-row" justify="center">
      <el-col :xs="24" :sm="12" :lg="8">
        <el-card class="entry-card" shadow="hover" @click="goTo('/question/list')">
          <div class="card-content">
            <svg-icon icon-class="documentation" class="card-icon" />
            <div class="card-title">题库管理</div>
            <div class="card-desc">录入 / 编辑 / 删除题目，维护公共题库供教师端使用</div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="8">
        <el-card class="entry-card" shadow="hover" @click="goTo('/system/user')">
          <div class="card-content">
            <svg-icon icon-class="peoples" class="card-icon" />
            <div class="card-title">系统管理</div>
            <div class="card-desc">用户 / 角色 / 菜单 / 权限等基础配置</div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts" name="Welcome">
import { useRouter } from 'vue-router';

const router = useRouter();

const goTo = (path: string) => {
  router.push(path);
};
</script>

<style lang="scss" scoped>
.welcome-container {
  padding: 40px 32px;
  min-height: calc(100vh - 84px);
  box-sizing: border-box;
}

.welcome-header {
  text-align: center;
  margin-bottom: 48px;

  h1 {
    font-size: 28px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin-bottom: 8px;
  }

  .welcome-sub {
    font-size: 15px;
    color: var(--el-text-color-secondary);
    margin: 0;
  }
}

.card-row {
  max-width: 960px;
  margin: 0 auto;
}

.entry-card {
  cursor: pointer;
  border-radius: 12px;
  transition: transform 0.2s, box-shadow 0.2s;
  margin-bottom: 24px;

  &:hover {
    transform: translateY(-4px);
  }

  .card-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 24px 16px;
    text-align: center;
  }

  .card-icon {
    font-size: 40px;
    color: var(--el-color-primary);
    margin-bottom: 16px;
  }

  .card-title {
    font-size: 18px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin-bottom: 8px;
  }

  .card-desc {
    font-size: 13px;
    color: var(--el-text-color-secondary);
    line-height: 1.6;
  }
}
</style>
