using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;

namespace QLNV.Models;

public partial class QlnvContext : DbContext
{
    public QlnvContext()
    {
    }

    public QlnvContext(DbContextOptions<QlnvContext> options)
        : base(options)
    {
    }

    public virtual DbSet<AccessLog> AccessLogs { get; set; }

    public virtual DbSet<AccessPoint> AccessPoints { get; set; }

    public virtual DbSet<Employee> Employees { get; set; }

    public virtual DbSet<Site> Sites { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
#warning To protect potentially sensitive information in your connection string, you should move it out of source code. You can avoid scaffolding the connection string by using the Name= syntax to read it from configuration - see https://go.microsoft.com/fwlink/?linkid=2131148. For more guidance on storing connection strings, see https://go.microsoft.com/fwlink/?LinkId=723263.
        => optionsBuilder.UseSqlServer("Server=PHI;Database=QLNV;Trusted_Connection=True;TrustServerCertificate=True;");

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<AccessLog>(entity =>
        {
            entity.HasKey(e => e.LogId).HasName("PK__AccessLo__5E5499A83336688F");

            entity.Property(e => e.LogId).HasColumnName("LogID");
            entity.Property(e => e.AccessPointId).HasColumnName("AccessPointID");
            entity.Property(e => e.AccessResult).HasMaxLength(50);
            entity.Property(e => e.AccessStatus).HasMaxLength(10);
            entity.Property(e => e.AccessTime)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.AccessType).HasMaxLength(50);
            entity.Property(e => e.EmployeeId).HasColumnName("EmployeeID");
            entity.Property(e => e.Note).HasMaxLength(500);

            entity.HasOne(d => d.AccessPoint).WithMany(p => p.AccessLogs)
                .HasForeignKey(d => d.AccessPointId)
                .HasConstraintName("FK_AccessLogs_AccessPoints");

            entity.HasOne(d => d.Employee).WithMany(p => p.AccessLogs)
                .HasForeignKey(d => d.EmployeeId)
                .HasConstraintName("FK_AccessLogs_Employees");
        });

        modelBuilder.Entity<AccessPoint>(entity =>
        {
            entity.HasKey(e => e.AccessPointId).HasName("PK__AccessPo__465A28479C84710F");

            entity.Property(e => e.AccessPointId).HasColumnName("AccessPointID");
            entity.Property(e => e.AccessName).HasMaxLength(100);
            entity.Property(e => e.CreatedDate)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.DeviceData).HasMaxLength(200);
            entity.Property(e => e.DeviceType).HasMaxLength(50);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.Location).HasMaxLength(200);
            entity.Property(e => e.ModifiedDate).HasColumnType("datetime");
            entity.Property(e => e.SiteId).HasColumnName("SiteID");

            entity.HasOne(d => d.Site).WithMany(p => p.AccessPoints)
                .HasForeignKey(d => d.SiteId)
                .HasConstraintName("FK_AccessPoints_Sites");
        });

        modelBuilder.Entity<Employee>(entity =>
        {
            entity.HasKey(e => e.EmployeeId).HasName("PK__Employee__7AD04FF11F8BBBD3");

            entity.Property(e => e.EmployeeId).HasColumnName("EmployeeID");
            entity.Property(e => e.AccessPointId).HasColumnName("AccessPointID");
            entity.Property(e => e.CreatedDate)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.Department).HasMaxLength(100);
            entity.Property(e => e.Email).HasMaxLength(100);
            entity.Property(e => e.EmployeeCode).HasMaxLength(50);
            entity.Property(e => e.FullName).HasMaxLength(100);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.ModifiedDate).HasColumnType("datetime");
            entity.Property(e => e.Password).HasMaxLength(255);
            entity.Property(e => e.Phone).HasMaxLength(12);
            entity.Property(e => e.Role).HasMaxLength(50);
            entity.Property(e => e.MemberCard).HasMaxLength(255);
        });

        modelBuilder.Entity<Site>(entity =>
        {
            entity.HasKey(e => e.SiteId).HasName("PK__Sites__B9DCB903FC9BB3E5");

            entity.Property(e => e.SiteId).HasColumnName("SiteID");
            entity.Property(e => e.Address).HasMaxLength(200);
            entity.Property(e => e.CreatedDate)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.ModifiedDate).HasColumnType("datetime");
            entity.Property(e => e.SiteName).HasMaxLength(100);
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
