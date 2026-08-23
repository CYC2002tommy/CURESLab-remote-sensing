import numpy as np
import matplotlib.pyplot as plt

def create_lca_sensitivity_heatmap(variance_limit, scenario_name, base_raw, base_mfg, base_trans, base_eol, output_path):
    """
    Generates a thermal heatmap showing % change in total GWP based on variations
    in product weight (y-axis) and transport distance (x-axis).
    
    variance_limit: float (e.g. 0.10 for 10%)
    scenario_name: str (e.g., "Incineration", "Landfill")
    output_path: str (.png file path)
    """
    # Create variance array (e.g., [-0.10, -0.05, 0.0, 0.05, 0.10])
    variances = np.linspace(-variance_limit, variance_limit, 5)
    baseline = base_raw + base_mfg + base_trans + base_eol
    
    matrix = np.zeros((len(variances), len(variances)))
    for i, w_var in enumerate(reversed(variances)): # Y-axis: Weight (reversed so positive is top)
        for j, d_var in enumerate(variances): # X-axis: Distance
            wf = 1 + w_var
            df = 1 + d_var
            val = (base_raw * wf) + (base_mfg * wf) + (base_trans * wf * df) + (base_eol * wf)
            matrix[i, j] = ((val - baseline) / baseline) * 100
            
    fig, ax = plt.subplots(figsize=(8, 6))
    cax = ax.matshow(matrix, cmap='coolwarm', vmin=-variance_limit*100, vmax=variance_limit*100)
    
    # Annotate cells
    for i in range(len(variances)):
        for j in range(len(variances)):
            color = 'black' if abs(matrix[i, j]) < variance_limit*50 else 'white'
            ax.text(j, i, f"{matrix[i, j]:.1f}%", ha='center', va='center', color=color, fontweight='bold')

    # Format Axes
    ax.set_xticks(np.arange(len(variances)))
    ax.set_yticks(np.arange(len(variances)))
    ax.set_xticklabels([f"{v*100:+.0f}%" for v in variances])
    ax.set_yticklabels([f"{v*100:+.0f}%" for v in reversed(variances)])
    
    ax.xaxis.set_ticks_position('bottom')
    ax.set_xlabel('Transport Distance Variance', fontsize=12)
    ax.set_ylabel('Product Weight Variance', fontsize=12)
    ax.set_title(f'Sensitivity Analysis: {scenario_name} (±{variance_limit*100:.0f}%)', pad=20, fontweight='bold')
    
    fig.colorbar(cax, label='Total GWP % Change')
    plt.tight_layout()
    plt.savefig(output_path, dpi=300)
    plt.close()
