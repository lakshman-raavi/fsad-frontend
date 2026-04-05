import { Navigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext.jsx';

const ProtectedRoute = ({ role, children }) => {
    const { user } = useAuthContext();

    if (!user) return <Navigate to="/login" replace />;

    const userRole = user.role?.toUpperCase();
    const requiredRoles = Array.isArray(role) ? role.map(r => r.toUpperCase()) : [role?.toUpperCase()];

    if (!requiredRoles.includes(userRole)) {
        return <Navigate to={userRole === 'STUDENT' ? '/student' : '/admin'} replace />;
    }
    return children;
};

export default ProtectedRoute;
