import axios from "axios";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

function ApiDemo() {
  const [users, setUsers] = useState([]);

  const getData = async () => {
    try {
      const res = await axios.get("https://node5.onrender.com/user/user");
      console.log(res);
      setUsers(res.data.data);
    } catch (error) {
      console.log(error);
    }
  };

  const onDelete = async (id) => {
    try {
      const res = await axios.delete(`https://node5.onrender.com/user/user/${id}`);
      console.log(res);
      toast.success("User deleted successfully");
      getData();
    } catch (error) {
      console.log("Error in deleting");
      toast.error("Error in deleting", error);
    }
  };

  useEffect(() => {
    getData();
  }, []);

  return (
    <div className="p-3">
      <div className="bg-white rounded-xl shadow-sm border border-[#e0dbd0] overflow-hidden">
        <table className="w-full text-sm text-[#4a5020]">
          {/* Header */}
          <thead className="bg-[#f5f3ec] text-[#6b6b52] uppercase text-xs tracking-wider">
            <tr>
              <th className="py-3 px-4 text-left">Name</th>
              <th className="py-3 px-4 text-left">Email</th>
              <th className="py-3 px-4 text-left">Age</th>
              <th className="py-3 px-4 text-left">Delete</th>
            </tr>
          </thead>

          {/* Body */}
          <tbody className="divide-y divide-[#f0ece4]">
            {users.map((user, index) => (
              <tr key={index} className="hover:bg-[#faf9f4] transition">
                <td className="py-3 px-4 text-[#2d3a1e]">{user.name}</td>
                <td className="py-3 px-4 text-[#5a7a30]">{user.email}</td>
                <td className="py-3 px-4">{user.age}</td>
                <td className="py-3 px-4">
                  <button
                    onClick={() => onDelete(user._id)}
                    className="bg-red-500 hover:bg-red-600 text-white rounded-md px-3 py-1 cursor-pointer transition-colors text-xs font-medium"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ApiDemo;