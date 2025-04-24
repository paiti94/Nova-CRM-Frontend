export const getUsers = async () => {
  try {
    const response = await fetch('/api/users');
    return await response.json();
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
}; 