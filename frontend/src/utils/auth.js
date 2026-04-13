export const getStoredUser = () => {
  try {
    const storedUser = localStorage.getItem("user");
    if (!storedUser || storedUser === "undefined") {
      return null;
    }

    return JSON.parse(storedUser);
  } catch {
    return null;
  }
};

export const isLoggedIn = () => Boolean(getStoredUser());
