<template>
  <div class="p-2">
    <!-- 顶部页头 -->
    <el-card shadow="hover" class="mb-[10px]">
      <div class="flex items-center justify-between">
        <el-page-header @back="handleBack">
          <template #content>
            <span class="text-base font-bold">{{ editId ? `编辑试卷 #${editId}` : '新建试卷' }}</span>
          </template>
        </el-page-header>
        <div>
          <el-button @click="handleBack">取消</el-button>
          <el-button type="primary" :loading="submitting" @click="handleSubmit">保存</el-button>
        </div>
      </div>
    </el-card>

    <el-card v-loading="loading" shadow="hover">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
        <!-- 卷名 -->
        <el-form-item label="试卷名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入试卷名称" maxlength="200" show-word-limit style="width: 480px" />
        </el-form-item>

        <!-- 目录名（分类） -->
        <el-form-item label="目录分类" prop="directoryName">
          <el-input v-model="form.directoryName" placeholder="如：公共卷库 / 专项卷库（可选）" style="width: 360px" />
        </el-form-item>

        <!-- 建议时长 -->
        <el-form-item label="建议时长(分)" prop="suggestTime">
          <el-input-number v-model="form.suggestTime" :min="0" :max="300" placeholder="分钟" style="width: 160px" />
        </el-form-item>

        <!-- 考试年份 -->
        <el-form-item label="考试年份" prop="examYear">
          <el-input v-model="form.examYear" placeholder="如：2025（可选）" style="width: 200px" />
        </el-form-item>

        <!-- 备注 -->
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="备注（可选）" style="width: 480px" />
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup name="PaperEdit" lang="ts">
import { addAdminPaper, updateAdminPaper, getAdminPaper } from '@/api/admin/paper';
import type { PaperForm } from '@/api/admin/paper/types';

const router = useRouter();
const route = useRoute();
const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const editId = computed(() => route.params.id as string | undefined);
const loading = ref(false);
const submitting = ref(false);

const formRef = ref<ElFormInstance>();

const form = reactive<PaperForm>({
  id: null,
  name: '',
  directoryName: '',
  suggestTime: undefined,
  examYear: '',
  remark: '',
  status: '0'
});

const rules = {
  name: [{ required: true, message: '请输入试卷名称', trigger: 'blur' }]
};

/** 加载详情（编辑模式） */
const loadDetail = async (id: string) => {
  loading.value = true;
  try {
    const res: any = await getAdminPaper(id);
    const detail = res?.data ?? res;
    if (detail) {
      Object.assign(form, {
        id: String(detail.id),
        name: detail.name ?? '',
        directoryName: detail.directoryName ?? '',
        suggestTime: detail.suggestTime,
        examYear: detail.examYear ?? '',
        remark: detail.remark ?? '',
        status: detail.status ?? '0'
      });
    }
  } catch (err: any) {
    proxy?.$modal.msgError('加载详情失败：' + (err?.message ?? '未知错误'));
  } finally {
    loading.value = false;
  }
};

const handleBack = () => {
  router.push('/paper/list');
};

const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;

  submitting.value = true;
  try {
    const payload: PaperForm = { ...form };
    if (editId.value) {
      payload.id = editId.value;
      const res: any = await updateAdminPaper(payload);
      if (res?.code === 200 || res?.code === undefined) {
        proxy?.$modal.msgSuccess('保存成功');
        handleBack();
      } else {
        proxy?.$modal.msgError(res?.msg || '保存失败');
      }
    } else {
      payload.id = null;
      const res: any = await addAdminPaper(payload);
      if (res?.code === 200 || res?.code === undefined) {
        proxy?.$modal.msgSuccess('新建成功');
        handleBack();
      } else {
        proxy?.$modal.msgError(res?.msg || '新建失败');
      }
    }
  } catch (err: any) {
    proxy?.$modal.msgError(err?.message || '操作失败');
  } finally {
    submitting.value = false;
  }
};

onMounted(() => {
  if (editId.value) {
    loadDetail(editId.value);
  }
});
</script>
