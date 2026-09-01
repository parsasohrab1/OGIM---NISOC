#!/usr/bin/env python3
"""
TimescaleDB Multi-node Cluster Management Script
"""
import argparse
import sys
import os

# Add shared module to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend', 'shared'))

from sqlalchemy import create_engine, text
from config import settings
from timescale_cluster import cluster_manager


def list_nodes():
    """List all data nodes in the cluster"""
    print("=" * 60)
    print("TimescaleDB Cluster - Data Nodes")
    print("=" * 60)
    
    nodes = cluster_manager.list_data_nodes()
    
    if not nodes:
        print("No data nodes found.")
        return
    
    print(f"\nFound {len(nodes)} data node(s):\n")
    for i, node in enumerate(nodes, 1):
        print(f"{i}. {node['node_name']}")
        print(f"   Host: {node['host']}:{node['port']}")
        print(f"   Database: {node['database']}")
        print(f"   Created: {node['node_created']}")
        print()


def add_node(host: str, port: int = 5432, name: str = None):
    """Add a data node to the cluster"""
    print(f"Adding data node: {host}:{port}")
    
    node_name = name or host.replace('.', '_').replace('-', '_')
    
    success = cluster_manager.add_data_node(
        node_host=host,
        node_port=port,
        database=settings.TIMESCALE_URL.split('/')[-1] if '/' in settings.TIMESCALE_URL else "ogim_tsdb",
        user="ogim_user",
        password="ogim_password"
    )
    
    if success:
        print(f"✓ Successfully added data node: {node_name}")
    else:
        print(f"✗ Failed to add data node: {node_name}")
        sys.exit(1)


def remove_node(node_name: str):
    """Remove a data node from the cluster"""
    print(f"Removing data node: {node_name}")
    
    success = cluster_manager.remove_data_node(node_name)
    
    if success:
        print(f"✓ Successfully removed data node: {node_name}")
    else:
        print(f"✗ Failed to remove data node: {node_name}")
        sys.exit(1)


def create_distributed_hypertable(table_name: str, time_column: str = "timestamp", 
                                  partition_column: str = None):
    """Create a distributed hypertable"""
    print(f"Creating distributed hypertable: {table_name}")
    
    success = cluster_manager.create_distributed_hypertable(
        table_name=table_name,
        time_column=time_column,
        partitioning_column=partition_column
    )
    
    if success:
        print(f"✓ Successfully created distributed hypertable: {table_name}")
    else:
        print(f"✗ Failed to create distributed hypertable: {table_name}")
        sys.exit(1)


def show_status():
    """Show cluster status"""
    print("=" * 60)
    print("TimescaleDB Cluster Status")
    print("=" * 60)
    
    status = cluster_manager.get_cluster_status()
    
    print(f"\nMulti-node Enabled: {status.get('multi_node_enabled', False)}")
    print(f"\nAccess Nodes: {len(status.get('access_nodes', []))}")
    for node in status.get('access_nodes', []):
        print(f"  - {node}")
    
    print(f"\nData Nodes: {len(status.get('data_nodes', []))}")
    for node in status.get('data_nodes', []):
        print(f"  - {node.get('node_name')} ({node.get('host')}:{node.get('port')})")
    
    print(f"\nDistributed Hypertables: {len(status.get('hypertables', []))}")
    for ht in status.get('hypertables', []):
        print(f"  - {ht.get('hypertable_name')} ({ht.get('num_chunks', 0)} chunks)")


def optimize_for_high_volume():
    """Optimize cluster for high-volume data ingestion (10GB/day)"""
    print("=" * 60)
    print("Optimizing TimescaleDB Cluster for High Volume")
    print("=" * 60)
    
    engine = create_engine(settings.TIMESCALE_URL)
    
    optimizations = [
        ("Setting chunk time interval to 1 day", """
            SELECT set_chunk_time_interval('sensor_data', INTERVAL '1 day');
        """),
        ("Enabling compression", """
            ALTER TABLE sensor_data SET (
                timescaledb.compress,
                timescaledb.compress_segmentby = 'tag_id'
            );
        """),
        ("Setting compression policy (compress chunks older than 90 days)", """
            SELECT add_compression_policy('sensor_data', INTERVAL '90 days');
        """),
        ("Setting retention policy (drop chunks older than 1 year)", """
            SELECT add_retention_policy('sensor_data', INTERVAL '1 year');
        """),
        ("Creating indexes for better query performance", """
            CREATE INDEX IF NOT EXISTS idx_sensor_data_tag_timestamp 
            ON sensor_data (tag_id, timestamp DESC);
        """),
        ("Optimizing autovacuum settings", """
            ALTER TABLE sensor_data SET (
                autovacuum_vacuum_scale_factor = 0.1,
                autovacuum_analyze_scale_factor = 0.05
            );
        """),
    ]
    
    with engine.connect() as conn:
        for desc, query in optimizations:
            try:
                print(f"\n{desc}...")
                conn.execute(text(query))
                conn.commit()
                print(f"✓ {desc}")
            except Exception as e:
                print(f"⚠ {desc} - {e}")
    
    print("\n" + "=" * 60)
    print("Optimization completed!")
    print("=" * 60)


def main():
    parser = argparse.ArgumentParser(description="TimescaleDB Multi-node Cluster Management")
    subparsers = parser.add_subparsers(dest='command', help='Command to execute')
    
    # List nodes
    subparsers.add_parser('list', help='List all data nodes')
    
    # Add node
    add_parser = subparsers.add_parser('add-node', help='Add a data node')
    add_parser.add_argument('host', help='Data node hostname or IP')
    add_parser.add_argument('--port', type=int, default=5432, help='Data node port')
    add_parser.add_argument('--name', help='Data node name (optional)')
    
    # Remove node
    remove_parser = subparsers.add_parser('remove-node', help='Remove a data node')
    remove_parser.add_argument('name', help='Data node name')
    
    # Create distributed hypertable
    create_parser = subparsers.add_parser('create-hypertable', help='Create distributed hypertable')
    create_parser.add_argument('table', help='Table name')
    create_parser.add_argument('--time-column', default='timestamp', help='Time column name')
    create_parser.add_argument('--partition-column', help='Partitioning column name')
    
    # Status
    subparsers.add_parser('status', help='Show cluster status')
    
    # Optimize
    subparsers.add_parser('optimize', help='Optimize cluster for high-volume data')
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        sys.exit(1)
    
    try:
        if args.command == 'list':
            list_nodes()
        elif args.command == 'add-node':
            add_node(args.host, args.port, args.name)
        elif args.command == 'remove-node':
            remove_node(args.name)
        elif args.command == 'create-hypertable':
            create_distributed_hypertable(args.table, args.time_column, args.partition_column)
        elif args.command == 'status':
            show_status()
        elif args.command == 'optimize':
            optimize_for_high_volume()
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()

