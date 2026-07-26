import { supabase } from '../config/supabase.config';
import {
    type User,
    type UpdateUserDto,
    PublicUser
} from '../types/user.types.js';
import { RegisterDto } from '../types/auth.types.js';
import {
    isSupabaseNotFound,
    toDatabaseError
} from '../utils/supabase-error.utils.js';
import type { AdminListOptions, AdminRecord } from '../utils/adminQuery.utils.js';

/** Danh sách cột an toàn để trả về client — không bao giờ gồm password_hash. */
const PUBLIC_COLUMNS =
    'user_id, email, full_name, phone, avatar_url, role, is_active, created_at';

/** Cột an toàn cho trang quản trị — giống PUBLIC_COLUMNS nhưng có thêm updated_at. */
const ADMIN_COLUMNS =
    'user_id, email, full_name, phone, avatar_url, role, is_active, created_at, updated_at';
const ADMIN_DEFAULT_ORDER = 'created_at';
const ADMIN_SORTABLE_FIELDS = new Set([
    'user_id',
    'email',
    'full_name',
    'created_at',
    'updated_at',
    'role',
    'is_active'
]);

const UserModel = {
    /** GET /admin/users — mọi tài khoản, lọc/sắp xếp/phân trang tùy ý, không lộ password_hash. */
    async adminFindAll(options: AdminListOptions): Promise<AdminRecord[]> {
        let query: any = supabase.from('users').select(ADMIN_COLUMNS);

        Object.entries(options.filters).forEach(([column, value]) => {
            query = query.eq(column, value);
        });

        const sortColumn =
            options.sort && ADMIN_SORTABLE_FIELDS.has(options.sort)
                ? options.sort
                : ADMIN_DEFAULT_ORDER;

        query = query.order(sortColumn, {
            ascending: options.ascending ?? false
        });

        if (options.limit !== undefined) {
            const offset = options.offset ?? 0;
            query = query.range(offset, offset + options.limit - 1);
        }

        const { data, error } = await query;
        if (error) throw toDatabaseError(error);
        return (data ?? []) as AdminRecord[];
    },

    async adminFindById(id: number): Promise<AdminRecord | null> {
        const { data, error } = await supabase
            .from('users')
            .select(ADMIN_COLUMNS)
            .eq('user_id', id)
            .single();

        if (isSupabaseNotFound(error)) return null;
        if (error) throw toDatabaseError(error);
        return data as unknown as AdminRecord;
    },

    /**
     * Ghi thẳng payload — password_hash cố tình không nằm trong danh sách
     * trường cho phép ở tầng controller, nên form admin không thể set/băm
     * mật khẩu qua đường này. Tạo tài khoản phải đi qua /auth/register.
     */
    async adminCreate(payload: AdminRecord): Promise<AdminRecord> {
        const { data, error } = await supabase
            .from('users')
            .insert(payload)
            .select(ADMIN_COLUMNS)
            .single();

        if (error) throw toDatabaseError(error);
        return data as unknown as AdminRecord;
    },

    async adminUpdate(id: number, payload: AdminRecord): Promise<AdminRecord> {
        const { data, error } = await supabase
            .from('users')
            .update(payload)
            .eq('user_id', id)
            .select(ADMIN_COLUMNS)
            .single();

        if (error) throw toDatabaseError(error);
        return data as unknown as AdminRecord;
    },

    async findAll(): Promise<User[]> {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw toDatabaseError(error);
        return data;
    },

    async findById(id: number): Promise<User | null> {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('user_id', id)
            .single();

        if (isSupabaseNotFound(error)) return null;
        if (error) throw toDatabaseError(error);
        return data;
    },

    async findByEmail(email: string): Promise<User | null> {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (isSupabaseNotFound(error)) return null;
        if (error) throw toDatabaseError(error);
        return data;
    },

    async create(dto: RegisterDto): Promise<PublicUser> {
        const { data, error } = await supabase
            .from('users')
            .insert(dto)
            .select(
                'user_id, email, full_name, phone, avatar_url, role, is_active, created_at'
            )
            .single();

        if (error) throw toDatabaseError(error);
        return data;
    },

    async update(id: string, dto: UpdateUserDto): Promise<User> {
        const { data, error } = await supabase
            .from('users')
            .update({ ...dto, updated_at: new Date().toISOString() })
            .eq('user_id', id)
            .select()
            .single();

        if (error) throw toDatabaseError(error);
        return data;
    },

    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('users')
            .delete()
            .eq('user_id', id);

        if (error) throw toDatabaseError(error);
    },

    /** Hồ sơ đầy đủ cho GET /user/me — loại bỏ password_hash ngay từ truy vấn. */
    async findPublicById(id: number): Promise<PublicUser | null> {
        const { data, error } = await supabase
            .from('users')
            .select(PUBLIC_COLUMNS)
            .eq('user_id', id)
            .maybeSingle();

        if (isSupabaseNotFound(error)) return null;
        if (error) throw toDatabaseError(error);
        return data as PublicUser | null;
    },

    /** PATCH /user/me — chỉ cập nhật các trường hồ sơ, không đụng password_hash. */
    async updateProfile(id: number, dto: UpdateUserDto): Promise<PublicUser> {
        const { data, error } = await supabase
            .from('users')
            .update({ ...dto, updated_at: new Date().toISOString() })
            .eq('user_id', id)
            .select(PUBLIC_COLUMNS)
            .single();

        if (error) throw toDatabaseError(error);
        return data as PublicUser;
    },

    /** PATCH /user/me/password — chỉ ghi password_hash đã băm sẵn. */
    async updatePasswordHash(id: number, passwordHash: string): Promise<void> {
        const { error } = await supabase
            .from('users')
            .update({
                password_hash: passwordHash,
                updated_at: new Date().toISOString()
            })
            .eq('user_id', id);

        if (error) throw toDatabaseError(error);
    }
};

export default UserModel;
