import createPrivateClient from '../clients/private.client';

const privateClient = createPrivateClient(); // <-- thêm dòng này

const menteeProfileApi = {
  getProfile: () => privateClient.get('/profile'),
  updateProfile: (data) => privateClient.put('/profile/mentee', data),
  updateAvatar: (formData) => privateClient.put('/profile/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
};

export default menteeProfileApi;