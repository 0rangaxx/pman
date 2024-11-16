import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/use-auth";
import { useLocation } from "wouter";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface UserListItem {
  id: number;
  username: string;
  isAdmin: boolean;
  createdAt: string;
}

export function Users() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [users, setUsers] = useState<UserListItem[]>([]);

  useEffect(() => {
    if (!user?.isAdmin) {
      navigate("/prompts");
      return;
    }

    fetch("/api/users")
      .then(res => res.json())
      .then(data => setUsers(data))
      .catch(console.error);
  }, [user, navigate]);

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-4">User Management</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Username</TableHead>
            <TableHead>Admin</TableHead>
            <TableHead>Created At</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map(user => (
            <TableRow key={user.id}>
              <TableCell>{user.username}</TableCell>
              <TableCell>{user.isAdmin ? "Yes" : "No"}</TableCell>
              <TableCell>
                {new Date(user.createdAt).toLocaleDateString()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
