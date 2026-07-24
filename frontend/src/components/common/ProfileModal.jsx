import React, { useState, useRef } from 'react';
import Modal from './Modal';
import Input from './Input';
import Button from './Button';
import { Camera, Mail, User, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../controllers/useAuth';
import toast from 'react-hot-toast';

export default function ProfileModal({ isOpen, onClose }) {
  const { user, updateProfile } = useAuth();
  
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar_url || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const fileInputRef = useRef(null);

  // Sync state if user changes
  React.useEffect(() => {
    if (user) {
      setFullName(user.fullName);
      setAvatarPreview(user.avatar_url);
      setAvatarFile(null);
    }
  }, [user, isOpen]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn một tệp hình ảnh hợp lệ.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB
      toast.error('Kích thước ảnh không được vượt quá 5MB.');
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error('Họ và tên không được để trống.');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('fullName', fullName.trim());
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      await updateProfile(formData);
      onClose();
    } catch (error) {
      toast.error(error.message || 'Có lỗi xảy ra khi cập nhật hồ sơ');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Hồ sơ cá nhân">
      <form onSubmit={handleSubmit} className="space-y-6 mt-4">
        
        {/* Avatar Section */}
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
            <div className="w-24 h-24 rounded-full bg-primary-light/50 flex items-center justify-center border-4 border-white shadow-md overflow-hidden transition-all group-hover:shadow-lg">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-primary font-bold text-3xl">
                  {fullName.charAt(0).toUpperCase() || 'U'}
                </span>
              )}
            </div>
            {/* Camera Overlay */}
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-8 h-8 text-white" />
            </div>
          </div>
          <p className="text-xs text-neutral-subtext text-center">
            Nhấn vào ảnh để thay đổi<br/>
            (Tối đa 5MB)
          </p>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden" 
          />
        </div>

        {/* Inputs */}
        <div className="space-y-4">
          <Input
            id="profile-email"
            label="Địa chỉ Email (Chỉ đọc)"
            value={user?.email || ''}
            icon={Mail}
            disabled
            className="opacity-70 cursor-not-allowed"
          />
          
          <Input
            id="profile-fullname"
            label="Họ và tên"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            icon={User}
            required
            maxLength={50}
          />
        </div>

        {/* Security Info */}
        <div className="rounded-xl bg-primary-light/30 p-3 border border-primary-light/50 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <p className="text-xs text-neutral-subtext leading-relaxed">
            Hồ sơ của bạn được bảo mật an toàn. Ảnh đại diện sẽ được lưu trữ qua nền tảng Cloudinary tốc độ cao.
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button variant="primary" type="submit" loading={isSubmitting}>
            Lưu thay đổi
          </Button>
        </div>
      </form>
    </Modal>
  );
}
