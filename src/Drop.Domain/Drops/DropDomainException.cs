using Drop.Domain.Common;

namespace Drop.Domain.Drops;

public sealed class DropDomainException : DomainException
{
    public DropDomainException(string code, string message)
        : base(code, message)
    {
    }
}
