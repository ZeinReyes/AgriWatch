const RoleBadge = ({
  role,
}) => {

  const roleLabels = {
    farmer: "Farmer",
    admin: "Administrator",
    viewer: "Viewer",
  };


  return (
    <span
      className={`role-badge role-${role}`}
    >
      {roleLabels[role] || role}
    </span>
  );
};


export default RoleBadge;