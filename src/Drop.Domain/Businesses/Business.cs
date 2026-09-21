using Drop.Domain.Common;

namespace Drop.Domain.Businesses;

public sealed class Business : Entity
{
    private Business()
    {
    }

    public Business(string name)
    {
        SetName(name);
    }

    public string Name { get; private set; } = null!;

    public void ChangeName(string name)
    {
        SetName(name);
    }

    private void SetName(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new ArgumentException(
                "Business name cannot be empty.",
                nameof(name));
        }

        Name = name.Trim();
    }
}
